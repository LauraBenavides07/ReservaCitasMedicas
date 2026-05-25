import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(IPatientRepository)
    private patientRepository: IPatientRepository,
    private jwtService: JwtService,
    private passwordHasher: IPasswordHasher,
    private keycloakService: KeycloakService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.patientRepository.findOneBy({
      document: dto.document,
    });
    if (existing) {
      throw new ConflictException('El documento ya está registrado.');
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

  async login(
    dto: LoginDto,
  ): Promise<{ access_token: string; user: UserData | null; source: string }> {
    try {
      const tokenResponse = await this.keycloakService.login(
        dto.password,
        dto.login,
      );
      const accessToken = tokenResponse.access_token;
      const rawDecoded: unknown = this.jwtService.decode(accessToken);
      const decodedToken =
        rawDecoded != null && typeof rawDecoded === 'object'
          ? (rawDecoded as Record<string, unknown>)
          : null;
      const keycloakSub = decodedToken?.sub as string | undefined;

      let userData: UserData | null = null;

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
      };
    } catch (error) {
      console.error(
        'Error autenticando con Keycloak:',
        error instanceof Error ? error.message : String(error),
      );
      return this.localLoginFallback(dto);
    }
  }

  private async localLoginFallback(
    dto: LoginDto,
  ): Promise<{ access_token: string; user: UserData | null; source: string }> {
    console.warn('Usando BD Local para Login (Fallback)');

    let dbUser: DbUser | null = await this.patientRepository.findOne({
      where: [{ document: dto.login }, { email: dto.login }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        password: true,
        document: true,
        email: true,
      },
    });

    let role = 'patient';

    if (!dbUser) {
      dbUser = await this.userRepository.findOne({
        where: { email: dto.login },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          password: true,
          email: true,
          role: true,
        },
      });
      if (dbUser && 'role' in dbUser) {
        role = dbUser.role || 'patient';
      }
    }

    if (
      dbUser &&
      dbUser.password &&
      (await this.passwordHasher.compare(dto.password, dbUser.password))
    ) {
      const userData: UserData = {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        role: role,
      };

      if ('document' in dbUser) {
        userData.document = dbUser.document;
      }

      const access_token = this.jwtService.sign({
        sub: dbUser.id,
        email: dbUser.email,
        role: role,
      });

      return {
        access_token,
        user: userData,
        source: 'local',
      };
    }
    throw new UnauthorizedException('Credenciales inválidas.');
  }

  async getPatientByDocument(document: string) {
    const patient = await this.patientRepository.findOne({
      where: { document },
      select: [
        'id',
        'firstName',
        'lastName',
        'document',
        'phone',
        'gender',
        'birthDate',
        'email',
      ],
    });

    if (!patient) {
      throw new UnauthorizedException('Paciente no encontrado.');
    }

    return patient;
  }
}
