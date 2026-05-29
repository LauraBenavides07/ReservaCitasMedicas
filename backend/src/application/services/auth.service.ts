import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../domain/entities/user.entity';
import { LoginDto } from '../../presentation/dto/login.dto';
import { RegisterDto } from '../../presentation/dto/register.dto';
import { JwtService } from '@nestjs/jwt';
import { IPasswordHasher } from '../abstractions/ipassword-hasher.interface';
import { KeycloakService } from '../../infrastructure/auth/keycloak.service';
import { IPatientRepository } from '../ports/patient.repository';
import { UserData, DbUser } from '../../domain/types/keycloak.types';
import { Doctor } from '../../domain/entities/doctor.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(IPatientRepository)
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    private patientRepository: IPatientRepository,
    private jwtService: JwtService,
    private passwordHasher: IPasswordHasher,
    private keycloakService: KeycloakService,
  
  ) {}

// backend/src/application/services/auth.service.ts

  async register(dto: RegisterDto) {
    // Validar documento duplicado
    const existingByDocument = await this.patientRepository.findOneBy({
      document: dto.document,
    });
    if (existingByDocument) {
      throw new ConflictException('El documento ya está registrado.');
    }

    // Validar email duplicado 
    if (dto.email) {
      const existingByEmail = await this.patientRepository.findOneBy({
        email: dto.email,
      });
      if (existingByEmail) {
        throw new ConflictException('El correo electrónico ya está registrado.');
      }
    }

    const hashedPassword = await this.passwordHasher.hash(dto.password);
    const patient = this.patientRepository.create({
      ...dto,
      password: hashedPassword,
    });

    await this.patientRepository.save(patient);

    try {
      await this.keycloakService.createUser({
        username: dto.document,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        password: dto.password,
      });
    } catch (kcError) {
      console.error(
        '[Auto-Provisioning] Advertencia: No se pudo crear el usuario en Keycloak automáticamente.',
        kcError instanceof Error ? kcError.message : String(kcError),
      );
    }

    return this.login({ login: dto.document, password: dto.password });
  }
  async resetDoctorPassword(doctorId: string): Promise<{ message: string }> {
    // Buscar el doctor para obtener su userId
    const doctor = await this.doctorRepository.findOne({
        where: { id: doctorId }
    });

    if (!doctor) {
        throw new NotFoundException('Médico no encontrado');
    }

    if (!doctor.userId) {
        throw new NotFoundException('Este médico no tiene usuario asociado');
    }

    const defaultPassword = '12345678';
    const hashedPassword = await this.passwordHasher.hash(defaultPassword);

    await this.userRepository.update(doctor.userId, {
        password: hashedPassword,
        mustChangePassword: true,
    });

    return { message: `Contraseña del médico restablecida a 12345678` };
  }
  
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ 
        where: { id: userId },
        select: {
              id: true,
              password: true,
              mustChangePassword: true
          }
    });
    
    if (!user) {
        throw new NotFoundException('Usuario no encontrado');
    }
    
    const isPasswordValid = await this.passwordHasher.compare(currentPassword, user.password);
    if (!isPasswordValid) {
        throw new UnauthorizedException('Contraseña actual incorrecta');
    }
    
    const hashedPassword = await this.passwordHasher.hash(newPassword);
    user.password = hashedPassword;
    user.mustChangePassword = false;
    
    await this.userRepository.save(user);
    
    return { message: 'Contraseña actualizada exitosamente' };
}

  async login(
    dto: LoginDto,
    ): Promise<{ access_token: string; user: UserData | null; source: string; mustChangePassword?: boolean }> {
        const normalizedLogin = dto.login.toLowerCase().trim();
    
    console.log('Login normalizado:', normalizedLogin);
    
    try {
        const tokenResponse = await this.keycloakService.login(
            dto.password,
            normalizedLogin,
        );
        const accessToken = tokenResponse.access_token;
        const rawDecoded: unknown = this.jwtService.decode(accessToken);
        const decodedToken =
            rawDecoded != null && typeof rawDecoded === 'object'
                ? (rawDecoded as Record<string, unknown>)
                : null;
        const keycloakSub = decodedToken?.sub as string | undefined;

        let userData: UserData | null = null;
        let mustChangePassword = false;

        const patient = await this.patientRepository.findOneBy([
            { document: dto.login },
            { email: dto.login },
        ]);

        if (patient) {
            if (!patient.keycloakId && keycloakSub) {
                patient.keycloakId = keycloakSub;
                await this.patientRepository.save(patient);
            }

            userData = {
                id: patient.id,
                document: patient.document,
                firstName: patient.firstName,
                lastName: patient.lastName,
                email: patient.email,
                role: 'patient',
            };
            
            if (patient.email) {
                const userRecord = await this.userRepository.findOne({
                    where: { email: patient.email },
                    select: { mustChangePassword: true }
                });
                mustChangePassword = userRecord?.mustChangePassword === true;
            }
        } else {
            const staffUser = await this.userRepository.findOneBy({
                email: dto.login,
            });
            if (staffUser) {
                if (!staffUser.keycloakId && keycloakSub) {
                    staffUser.keycloakId = keycloakSub;
                    await this.userRepository.save(staffUser);
                }

                userData = {
                    id: staffUser.id,
                    email: staffUser.email,
                    firstName: staffUser.firstName,
                    lastName: staffUser.lastName,
                    role: staffUser.role,
                };
                
                
                mustChangePassword = staffUser.mustChangePassword === true;
            }
        }

        if (!userData) {
            throw new UnauthorizedException(
                'Usuario autenticado pero no encontrado en la base de datos local.',
            );
        }

        return {
            access_token: accessToken,
            user: userData,
            source: 'keycloak',
            mustChangePassword 
        };
    } catch (error) {
        console.error(
            'Error autenticando con Keycloak:',
            error instanceof Error ? error.message : String(error),
        );
        return this.localLoginFallback({ ...dto, login: normalizedLogin });
    }
  }

  private async localLoginFallback(
    dto: LoginDto,
): Promise<{ access_token: string; user: UserData | null; source: string; mustChangePassword?: boolean }> {
    console.log('=== LOCAL LOGIN FALLBACK ===');
    
    // Normalizar login a minúsculas
    const normalizedLogin = dto.login.toLowerCase().trim();
    console.log('Buscando usuario con email (normalizado):', normalizedLogin);
    
    // Buscar en users con email normalizado
    const user = await this.userRepository.findOne({
        where: { email: normalizedLogin },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            password: true,
            email: true,
            role: true,
            mustChangePassword: true,
        },
    });
    
    console.log('Usuario encontrado en users:', user ? 'SÍ' : 'NO');
    
    if (user && user.password) {
        const isPasswordValid = await this.passwordHasher.compare(dto.password, user.password);
        console.log('Contraseña válida:', isPasswordValid);
        
        if (isPasswordValid) {
            const userData: UserData = {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            };
            
            const access_token = this.jwtService.sign({
                sub: user.id,
                email: user.email,
                role: user.role,
            });

            const mustChangePassword = user.mustChangePassword === true;
            console.log('Enviando mustChangePassword:', mustChangePassword);
            
            return {
                access_token,
                user: userData,
                source: 'local',
                mustChangePassword
            };
        }
    }
    
    // Buscar en patients con email o documento normalizado
    let patient = await this.patientRepository.findOne({
        where: { email: normalizedLogin }
    });
    
    if (!patient) {
        patient = await this.patientRepository.findOne({
            where: { document: normalizedLogin }
        });
    }
    
    if (patient && patient.password) {
        const isPasswordValid = await this.passwordHasher.compare(dto.password, patient.password);
        if (isPasswordValid) {
            const userData: UserData = {
                id: patient.id,
                email: patient.email,
                firstName: patient.firstName,
                lastName: patient.lastName,
                document: patient.document,
                role: 'patient',
            };
            
            const access_token = this.jwtService.sign({
                sub: patient.id,
                email: patient.email,
                role: 'patient',
            });
            
            return {
                access_token,
                user: userData,
                source: 'local',
                mustChangePassword: false
            };
        }
    }
    
    console.log(' Login fallido');
    throw new UnauthorizedException('Credenciales inválidas.');
}

  async getPatientByDocument(document: string) {
    const patient = await this.patientRepository.findOne({
      where: { document },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        document: true,
        phone: true,
        gender: true,
        birthDate: true,
        email: true,
      },
    });

    if (!patient) {
      throw new UnauthorizedException('Paciente no encontrado.');
    }

    return patient;
  }

  async existeDocumento(document: string): Promise<boolean> {
    return this.patientRepository.existeDocumento(document);
  }
}
