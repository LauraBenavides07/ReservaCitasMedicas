import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { Doctor } from '../../domain/entities/doctor.entity';
import { IDoctorRepository } from '../ports/doctor.repository';
import { IAppointmentRepository } from '../ports/appointment.repository';
import { CreateDoctorDto } from '../../presentation/dto/create-doctor.dto';
import { UpdateDoctorDto } from '../../presentation/dto/update-doctor.dto';
import { User, UserRole } from '../../domain/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { KeycloakService } from '../../infrastructure/auth/keycloak.service';

@Injectable()
export class DoctorService {
  private readonly logger = new Logger(DoctorService.name);

  constructor(
    @Inject(IDoctorRepository)
    private readonly doctorRepository: IDoctorRepository,
    @Inject(IAppointmentRepository)
    private readonly appointmentRepository: IAppointmentRepository,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly keycloakService: KeycloakService,
  ) {}

  async findAll(): Promise<Doctor[]> {
    return this.doctorRepository.find();
  }

  async findOne(id: string): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOneBy({ id });
    if (!doctor) {
      throw new NotFoundException('Doctor no encontrado');
    }
    return doctor;
  }

  async create(data: CreateDoctorDto): Promise<Doctor> {
    if (!data.document) {
      throw new BadRequestException('La cédula del médico es obligatoria');
    }

    const existsInDoctors = await this.doctorRepository.existsByDocument(
      data.document,
    );
    if (existsInDoctors) {
      throw new ConflictException('Ya existe un médico con esta cédula');
    }

    const existsInPatients = await this.doctorRepository.existsInPatients(
      data.document,
    );
    if (existsInPatients) {
      throw new ConflictException(
        'Esta cédula ya está registrada como paciente.',
      );
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new ConflictException('Este correo electrónico ya está registrado');
    }

    const defaultPassword = '12345678';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const normalizedEmail = data.email.toLowerCase().trim();

    const user = this.userRepository.create({
      email: normalizedEmail,
      password: hashedPassword,
      firstName: data.name.split(' ')[0],
      lastName: data.name.split(' ').slice(1).join(' ') || '',
      role: UserRole.DOCTOR,
      mustChangePassword: true,
    });

    await this.userRepository.save(user);

    // Crear en Keycloak con email como username
    try {
      await this.keycloakService.createUser({
        username: normalizedEmail,
        firstName: data.name.split(' ')[0],
        lastName: data.name.split(' ').slice(1).join(' ') || '',
        email: normalizedEmail,
        password: defaultPassword,
      });
      this.logger.log(`Doctor ${normalizedEmail} creado en Keycloak`);
    } catch (kcError) {
      this.logger.warn(
        `No se pudo crear el doctor en Keycloak: ${kcError instanceof Error ? kcError.message : String(kcError)}`,
      );
    }

    const doctor = this.doctorRepository.create({
      ...data,
      email: normalizedEmail,
      userId: user.id,
    });

    return this.doctorRepository.save(doctor);
  }

  async update(id: string, data: UpdateDoctorDto): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOneBy({ id });
    if (!doctor) {
      throw new NotFoundException('Doctor no encontrado');
    }
    if (data.document && data.document !== doctor.document) {
      // Validar en médicos
      const existsInDoctors = await this.doctorRepository.existsByDocument(
        data.document,
      );
      if (existsInDoctors) {
        throw new ConflictException('Ya existe otro médico con esta cédula');
      }

      const existsInPatients = await this.doctorRepository.existsInPatients(
        data.document,
      );
      if (existsInPatients) {
        throw new ConflictException(
          'Esta cédula ya está registrada como paciente. No puede asignarla a un médico.',
        );
      }
    }

    await this.doctorRepository.update(id, data);
    const updated = await this.doctorRepository.findOneBy({ id });
    if (!updated) {
      throw new NotFoundException('Doctor no encontrado después de actualizar');
    }
    return updated;
  }

  async remove(id: string): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOneBy({ id });
    if (!doctor) {
      throw new NotFoundException('Doctor no encontrado');
    }

    const count = await this.appointmentRepository.count({
      where: { doctor: { id } },
    });
    if (count > 0) {
      throw new BadRequestException(
        'No se puede eliminar un médico con citas agendadas',
      );
    }

    return this.doctorRepository.remove(doctor);
  }

  async resetPassword(doctorId: string): Promise<{ message: string }> {
    const doctor = await this.doctorRepository.findOneBy({ id: doctorId });

    if (!doctor) {
      throw new NotFoundException('Médico no encontrado');
    }

    if (!doctor.userId) {
      throw new NotFoundException('Este médico no tiene usuario asociado');
    }

    const defaultPassword = '12345678';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    await this.userRepository.update(doctor.userId, {
      password: hashedPassword,
      mustChangePassword: true,
    });

    return { message: 'Contraseña del médico restablecida a 12345678' };
  }
}
