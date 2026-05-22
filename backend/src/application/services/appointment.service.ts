import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';
import { Appointment } from '../../domain/entities/appointment.entity';
import { Doctor } from '../../domain/entities/doctor.entity';
import { CreateAppointmentDto } from '../../presentation/dto/create-appointment.dto';
import { ConfigService } from './config.service';
import { AvailabilityService } from './availability.service';
import { PatientService } from './patient.service';
import { NotificationService } from './notification.service';
import { IAppointmentRepository } from '../ports/appointment.repository';
import { IDoctorRepository } from '../ports/doctor.repository';

@Injectable()
export class AppointmentService {
  constructor(
    @Inject(IAppointmentRepository)
    private appointmentRepository: IAppointmentRepository,
    @Inject(IDoctorRepository)
    private doctorRepository: IDoctorRepository,
    private configService: ConfigService,
    private availabilityService: AvailabilityService,
    private patientService: PatientService,
    private notificationService: NotificationService,
  ) {}

  async findAllByDoctorAndDate(
    doctorId: string,
    date?: string,
    skip = 0,
    take = 100,
  ) {
    const whereClause: FindOptionsWhere<Appointment> = {
      doctor: { id: doctorId },
    };
    if (date && date.trim() !== '') {
      whereClause.appointmentDate = date;
    }

    const [appointments, total] = await this.appointmentRepository.findAndCount(
      {
        where: whereClause,
        relations: ['patient', 'doctor'],
        order: {
          appointmentDate: 'DESC',
          appointmentTime: 'ASC',
        },
        skip,
        take,
      },
    );

    return { appointments, total };
  }

  async create(createDto: CreateAppointmentDto) {
    const doctor = await this.doctorRepository.findOneBy({
      id: createDto.doctorId,
    });
    if (!doctor) {
      throw new NotFoundException(
        `Doctor con ID ${createDto.doctorId} no encontrado`,
      );
    }

    await this.availabilityService.validateTimeWindow(
      createDto.date,
      createDto.time,
    );
    await this.availabilityService.validateDoctorException(
      doctor.id,
      createDto.date,
    );
    await this.availabilityService.assertSlotAvailable(
      doctor.id,
      createDto.date,
      createDto.time,
    );

    const patient = await this.patientService.findByDocumentOrCreate({
      document: createDto.patientDocument,
      firstName: createDto.firstName,
      lastName: createDto.lastName,
      phone: createDto.phone,
      gender: createDto.gender,
    });

    const appointment = this.appointmentRepository.create({
      appointmentDate: createDto.date,
      appointmentTime: createDto.time,
      doctor,
      patient,
    });

    let saved;
    try {
      saved = await this.appointmentRepository.save(appointment);
    } catch (error: unknown) {
      const pgError = error as { code?: string };
      if (pgError?.code === '23505') {
        throw new ConflictException(
          'El horario ya está ocupado para este médico.',
        );
      }
      throw error;
    }

    this.notificationService.emit('appointment.created', {
      appointmentId: saved.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientPhone: patient.phone,
      doctorName: doctor.name,
      appointmentDate: saved.appointmentDate,
      appointmentTime: saved.appointmentTime,
    });

    return saved;
  }

  async findAllByPatient(patientId: string, document?: string) {
    const whereConditions: FindOptionsWhere<Appointment>[] = [
      { patient: { id: patientId } },
      { patient: { keycloakId: patientId } },
    ];
    if (document) {
      whereConditions.push({ patient: { document } });
    }

    const appointments = await this.appointmentRepository.find({
      where: whereConditions,
      relations: ['doctor'],
      order: { appointmentDate: 'DESC', appointmentTime: 'ASC' },
    });
    return appointments;
  }

  async cancelAppointment(
    appointmentId: string,
    patientId: string,
    localRole?: string,
  ) {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: ['patient', 'doctor'],
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada.');
    }

    const isStaff =
      localRole && ['admin', 'doctor', 'staff'].includes(localRole);
    if (!isStaff && !appointment.isOwnedBy(patientId)) {
      throw new UnauthorizedException(
        'No tienes permiso para cancelar esta cita.',
      );
    }

    if (!appointment.canBeCancelled()) {
      throw new BadRequestException(
        'No se puede cancelar una cita pasada o ya finalizada.',
      );
    }

    appointment.cancel();
    const saved = await this.appointmentRepository.save(appointment);

    this.notificationService.emit('appointment.cancelled', {
      appointmentId: saved.id,
      patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      patientPhone: appointment.patient.phone,
      doctorName: appointment.doctor.name,
      appointmentDate: saved.appointmentDate,
      appointmentTime: saved.appointmentTime,
    });

    return saved;
  }

  async confirmAppointment(appointmentId: string) {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada.');
    }

    if (appointment.isCancelled()) {
      throw new BadRequestException(
        'No se puede confirmar una cita cancelada.',
      );
    }

    appointment.confirm();
    return this.appointmentRepository.save(appointment);
  }

  async completeAppointment(
    appointmentId: string,
    observations?: string,
    diagnosis?: string,
  ) {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada.');
    }

    if (appointment.isCancelled()) {
      throw new BadRequestException(
        'No se puede completar una cita cancelada.',
      );
    }

    appointment.complete();
    appointment.observations = observations;
    appointment.diagnosis = diagnosis;

    return this.appointmentRepository.save(appointment);
  }

  async reschedule(
    id: string,
    userId: string,
    date: string,
    time: string,
    localRole?: string,
    doctorId?: string,
  ) {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['patient', 'doctor'],
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada.');
    }

    // Restricción: Solo médicos, administradores y agendadores pueden reagendar
    const isStaff =
      localRole &&
      ['admin', 'doctor', 'staff'].includes(localRole.toLowerCase());

    if (!isStaff) {
      throw new UnauthorizedException(
        'Los pacientes no tienen permiso para reagendar citas.',
      );
    }

    let targetDoctorId = appointment.doctor.id;
    let targetDoctor = appointment.doctor;

    if (doctorId && doctorId !== appointment.doctor.id) {
      const newDoctor = await this.doctorRepository.findOneBy({ id: doctorId });
      if (!newDoctor) {
        throw new NotFoundException(`Doctor con ID ${doctorId} no encontrado`);
      }
      targetDoctorId = newDoctor.id;
      targetDoctor = newDoctor;
      appointment.doctor = newDoctor;
    }

    await this.availabilityService.assertSlotAvailable(
      targetDoctorId,
      date,
      time,
      id,
    );

    await this.availabilityService.validateTimeWindow(date, time);
    await this.availabilityService.validateDoctorException(
      targetDoctorId,
      date,
    );

    appointment.reschedule(date, time);
    const saved = await this.appointmentRepository.save(appointment);

    this.notificationService.emit('appointment.rescheduled', {
      appointmentId: saved.id,
      patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      patientPhone: appointment.patient.phone,
      doctorName: targetDoctor.name,
      appointmentDate: saved.appointmentDate,
      appointmentTime: saved.appointmentTime,
    });

    return saved;
  }

  async findAll(skip = 0, take = 100) {
    return this.appointmentRepository.find({
      relations: ['doctor', 'patient'],
      order: { appointmentDate: 'DESC', appointmentTime: 'ASC' },
      skip,
      take,
    });
  }

  async findById(id: string) {
    return this.appointmentRepository.findOneBy({ id });
  }

  async findPatientByDocument(document: string) {
    return this.patientService.findByDocument(document);
  }
}
