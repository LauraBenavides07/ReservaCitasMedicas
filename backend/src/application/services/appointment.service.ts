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
import { CreateAppointmentDto } from '../../presentation/dto/create-appointment.dto';
import { ConfigService } from './config.service';
import { AvailabilityService } from './availability.service';
import { PatientService } from './patient.service';
import { NotificationService } from './notification.service';
import { IAppointmentRepository } from '../ports/appointment.repository';
import { IDoctorRepository } from '../ports/doctor.repository';
import { IAppointmentHistoryRepository } from '../ports/appointment-history.repository';

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
    @Inject(IAppointmentHistoryRepository)
    private historyRepository: IAppointmentHistoryRepository,
  ) {}

  private async saveHistory(params: {
    appointment: Appointment;
    changeType: string;
    previousDate?: string;
    previousTime?: string;
    previousStatus?: string;
    newDate?: string;
    newTime?: string;
    newStatus?: string;
    changedBy: string;
    changedByRole: string;
  }): Promise<void> {
    const history = this.historyRepository.create({
      appointment: params.appointment,
      changeType: params.changeType,
      previousDate: params.previousDate || null,
      previousTime: params.previousTime || null,
      previousStatus: params.previousStatus || null,
      newDate: params.newDate || null,
      newTime: params.newTime || null,
      newStatus: params.newStatus || null,
      changedBy: params.changedBy,
      changedByRole: params.changedByRole,
      
    });
    await this.historyRepository.save(history);
  }

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
        relations: { patient: true, doctor: true },
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

    let saved: Appointment;
    try {
      saved = await this.appointmentRepository.save(appointment);
    } catch (error: unknown) {
      const pgError = error as { code?: string };
      if (pgError?.code === '23505') {
        // Race condition: intentar recuperar la cita que se creó
        const existingAppointment = await this.appointmentRepository.findOneBy({
          doctor: { id: doctor.id },
          appointmentDate: createDto.date,
          appointmentTime: createDto.time,
        });

        if (existingAppointment) {
          // La cita existe - probablemente fue creada por otra petición en paralelo
          // Retornar la cita existente en lugar de error
          return existingAppointment;
        }

        // Si no existe, entonces sí fue un conflicto real
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
      patientEmail: patient.email || null,
      doctorName: doctor.name,
      appointmentDate: saved.appointmentDate,
      appointmentTime: saved.appointmentTime,
    });

    await this.saveHistory({
      appointment: saved,
      changeType: 'CREATED',
      newDate: saved.appointmentDate,
      newTime: saved.appointmentTime,
      newStatus: saved.status,
      changedBy: createDto.patientDocument || 'system',
      changedByRole: 'patient',
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
      relations: { doctor: true },
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
      relations: { patient: true, doctor: true },
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

    const previousStatus = appointment.status;
    appointment.cancel();
    const saved = await this.appointmentRepository.save(appointment);

    this.notificationService.emit('appointment.cancelled', {
      appointmentId: saved.id,
      patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      patientPhone: appointment.patient.phone,
      patientEmail: appointment.patient.email || null,
      doctorName: appointment.doctor.name,
      appointmentDate: saved.appointmentDate,
      appointmentTime: saved.appointmentTime,
    });

    await this.saveHistory({
      appointment: saved,
      changeType: 'CANCELLED',
      previousStatus,
      newStatus: saved.status,
      changedBy: patientId,
      changedByRole: isStaff ? localRole || 'staff' : 'patient',
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

    const previousStatus = appointment.status;
    appointment.confirm();
    const saved = await this.appointmentRepository.save(appointment);

    await this.saveHistory({
      appointment: saved,
      changeType: 'CONFIRMED',
      previousStatus,
      newStatus: saved.status,
      changedBy: 'system',
      changedByRole: 'staff',
    });

    return saved;
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

    const previousStatus = appointment.status;
    appointment.complete();
    appointment.observations = observations;
    appointment.diagnosis = diagnosis;

    const saved = await this.appointmentRepository.save(appointment);

    await this.saveHistory({
      appointment: saved,
      changeType: 'COMPLETED',
      previousStatus,
      newStatus: saved.status,
      changedBy: 'system',
      changedByRole: 'doctor',
    });

    return saved;
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
      relations: { patient: true, doctor: true },
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

    const previousDate = appointment.appointmentDate;
    const previousTime = appointment.appointmentTime;
    const previousStatus = appointment.status;

    appointment.reschedule(date, time);
    const saved = await this.appointmentRepository.save(appointment);

    this.notificationService.emit('appointment.rescheduled', {
      appointmentId: saved.id,
      patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      patientPhone: appointment.patient.phone,
      patientEmail: appointment.patient.email || null,
      doctorName: targetDoctor.name,
      appointmentDate: saved.appointmentDate,
      appointmentTime: saved.appointmentTime,
    });

    await this.saveHistory({
      appointment: saved,
      changeType: 'RESCHEDULED',
      previousDate,
      previousTime,
      previousStatus,
      newDate: saved.appointmentDate,
      newTime: saved.appointmentTime,
      newStatus: saved.status,
      changedBy: userId,
      changedByRole: localRole || 'staff',
    });

    return saved;
  }

  async findAll(skip = 0, take = 100) {
    return this.appointmentRepository.find({
      relations: { doctor: true, patient: true },
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

  async getAppointmentHistory(appointmentId: string) {
    const history = await this.historyRepository.find({
      where: { appointment: { id: appointmentId } },
      relations: { appointment: { doctor: true, patient: true } },
      order: { changedAt: 'DESC' },
    });

    return history.map((entry) => ({
      id: entry.id,
      appointmentId: entry.appointment.id,
      changeType: entry.changeType,
      previousDate: entry.previousDate,
      previousTime: entry.previousTime,
      previousStatus: entry.previousStatus,
      newDate: entry.newDate,
      newTime: entry.newTime,
      newStatus: entry.newStatus,
      changedBy: entry.changedBy,
      changedByRole: entry.changedByRole,
      reason: entry.reason,
      changedAt: entry.changedAt,
    }));
  }

  async getAllHistory(filters: {
    appointmentId?: string;
    changeType?: string;
    limit?: number;
    doctorId?: string;
    date?: string;
    search?: string;
  }) {
    const query = this.historyRepository
      .createQueryBuilder('h')
      .leftJoinAndSelect('h.appointment', 'a')
      .leftJoinAndSelect('a.doctor', 'd')
      .leftJoinAndSelect('a.patient', 'p')
      .orderBy('h.changedAt', 'DESC')
      .take(filters.limit || 50);

    if (filters.appointmentId) {
      query.andWhere('h.appointmentId = :appointmentId', {
        appointmentId: filters.appointmentId,
      });
    }
    if (filters.changeType) {
      query.andWhere('h.changeType = :changeType', {
        changeType: filters.changeType,
      });
    }
    if (filters.doctorId) {
      query.andWhere('d.id = :doctorId', { doctorId: filters.doctorId });
    }
    if (filters.date) {
      query.andWhere('a.appointmentDate = :date', { date: filters.date });
    }
    if (filters.search) {
      query.andWhere(
        "(p.firstName ILIKE :search OR p.lastName ILIKE :search OR p.document ILIKE :search OR CONCAT(p.firstName, ' ', p.lastName) ILIKE :search)",
        { search: `%${filters.search}%` },
      );
    }

    const [history, total] = await query.getManyAndCount();

    return {
      total,
      history: history.map((entry) => ({
        id: entry.id,
        appointmentId: entry.appointment.id,
        changeType: entry.changeType,
        previousDate: entry.previousDate,
        previousTime: entry.previousTime,
        previousStatus: entry.previousStatus,
        newDate: entry.newDate,
        newTime: entry.newTime,
        newStatus: entry.newStatus,
        changedBy: entry.changedBy,
        changedByRole: entry.changedByRole,
        reason: entry.reason,
        changedAt: entry.changedAt,
        doctorName: entry.appointment.doctor?.name,
        doctorSpecialty: entry.appointment.doctor?.specialty,
        doctorDocument: entry.appointment.doctor?.document,
        patientName: entry.appointment.patient
          ? `${entry.appointment.patient.firstName} ${entry.appointment.patient.lastName}`
          : null,
        patientDocument: entry.appointment.patient?.document,
      })),
    };
  }
}
