import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../../domain/entities/patient.entity';
import { User } from '../../domain/entities/user.entity';
import { LoginDto } from '../../presentation/dto/login.dto';
import { RegisterDto } from '../../presentation/dto/register.dto'; // Added back RegisterDto
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.patientRepository.findOneBy({
      document: dto.document,
    });
    if (existing) {
      throw new ConflictException('El documento ya está registrado.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const patient = this.patientRepository.create({
      ...dto,
      password: hashedPassword,
    });

    await this.patientRepository.save(patient);
    return this.login({ login: dto.document, password: dto.password });
  }

  async login(dto: LoginDto) {
    // 1. Intentar buscar en la tabla de Usuarios Internos (Admin, Staff)
    const internalUser = await this.userRepository.findOne({
      where: { email: dto.login },
    });

    if (
      internalUser &&
      (await bcrypt.compare(dto.password, internalUser.password))
    ) {
      const payload = {
        sub: internalUser.id,
        email: internalUser.email,
        role: internalUser.role,
      };
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: internalUser.id,
          firstName: internalUser.firstName,
          lastName: internalUser.lastName,
          email: internalUser.email,
          role: internalUser.role,
        },
      };
    }

    // 2. Si no es usuario interno, intentar buscar en Pacientes
    const patient = await this.patientRepository.findOne({
      where: [{ document: dto.login }, { email: dto.login }],
      select: [
        'id',
        'firstName',
        'lastName',
        'password',
        'document',
        'phone',
        'gender',
      ],
    });

    if (
      patient &&
      patient.password &&
      (await bcrypt.compare(dto.password, patient.password))
    ) {
      const payload = {
        sub: patient.id,
        document: patient.document,
        role: 'patient',
      };
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          document: patient.document,
          phone: patient.phone,
          gender: patient.gender,
          role: 'patient',
        },
      };
    }

    throw new UnauthorizedException('Credenciales inválidas.');
  }

  async getPatientByDocument(document: string) {
    const patient = await this.patientRepository.findOne({
      where: { document },
      select: ['id', 'firstName', 'lastName', 'document', 'phone', 'gender', 'birthDate', 'email'],
    });

    if (!patient) {
      throw new UnauthorizedException('Paciente no encontrado.');
    }

    return patient;
  }
}
