import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Parser } from 'json2csv';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { Appointment } from '../../domain/entities/appointment.entity';
import { Patient } from '../../domain/entities/patient.entity';
import { Doctor } from '../../domain/entities/doctor.entity';
import { DoctorException } from '../../domain/entities/doctor-exception.entity';
import { CreateAppointmentDto } from '../../presentation/dto/create-appointment.dto';
import { ConfigService } from './config.service';
import { NOTIFICATION_SERVICE } from '../../infrastructure/messaging/notifications-client.module';
import { timeToMinutes, minutesToTime } from '../utils/time.utils';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    @InjectRepository(DoctorException)
    private doctorExceptionRepository: Repository<DoctorException>,
    private configService: ConfigService,
    @Inject(NOTIFICATION_SERVICE)
    private notificationClient: ClientProxy,
  ) {}

  /**
   * Requisito 1: Listar citas por médico y fecha
   */
  async findAllByDoctorAndDate(
    doctorId: string,
    date?: string,
    skip = 0,
    take = 100,
  ) {
    const whereClause: FindOptionsWhere<Appointment> = { doctor: { id: doctorId } };
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

    return {
      appointments,
      total,
    };
  }

  /**
   * Requisito 2: Crear cita manual
   */
  async create(createDto: CreateAppointmentDto) {
    const doctor = await this.doctorRepository.findOneBy({
      id: createDto.doctorId,
    });
    if (!doctor) {
      throw new NotFoundException(
        `Doctor con ID ${createDto.doctorId} no encontrado`,
      );
    }

    // Regla de Negocio: Ventana de tiempo
    const config = await this.configService.getConfig();
    const minAdvanceHours = config?.minAdvanceHours ?? 2;
    const appointmentWindowDays = config?.appointmentWindowDays ?? 15;

    const now = new Date();
    const appointmentDate = new Date(`${createDto.date}T${createDto.time}`);

    const diffHours =
      (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (diffHours < minAdvanceHours) {
      throw new BadRequestException(
        `Debe agendar con al menos ${minAdvanceHours} horas de antelación.`,
      );
    }

    const horizonDate = new Date();
    horizonDate.setDate(now.getDate() + appointmentWindowDays);
    if (appointmentDate > horizonDate) {
      throw new BadRequestException(
        `No se puede agendar con más de ${appointmentWindowDays} días de antelación.`,
      );
    }

    // Regla de Negocio: Excepciones del médico
    const exception = await this.doctorExceptionRepository.findOneBy({
      doctorId: doctor.id,
      date: createDto.date,
    });
    if (exception) {
      throw new BadRequestException(
        `El médico no atiende este día: ${exception.reason || 'No disponible'}`,
      );
    }

    // Verificar si existe el paciente, si no, crearlo
    let patient = await this.patientRepository.findOneBy({
      document: createDto.patientDocument,
    });
    if (!patient) {
      try {
        patient = this.patientRepository.create({
          document: createDto.patientDocument,
          firstName: createDto.firstName,
          lastName: createDto.lastName,
          phone: createDto.phone,
          gender: createDto.gender,
        });
        await this.patientRepository.save(patient);
      } catch (error: unknown) {
        const pgError = error as { code?: string };
        if (pgError?.code === '23505') {
          patient = await this.patientRepository.findOneBy({
            document: createDto.patientDocument,
          });
          if (!patient) throw error;
        } else {
          throw error;
        }
      }
    }

    // Verificar disponibilidad
    const existing = await this.appointmentRepository.findOneBy({
      doctor: { id: doctor.id },
      appointmentDate: createDto.date,
      appointmentTime: createDto.time,
    });

    if (existing) {
      throw new ConflictException(
        'El horario ya está ocupado para este médico.',
      );
    }

    const appointment = this.appointmentRepository.create({
      appointmentDate: createDto.date,
      appointmentTime: createDto.time,
      doctor: doctor,
      patient: patient,
      status: 'agendada',
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
   
    this.emitEvent('appointment.created', {
      appointmentId: saved.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientPhone: patient.phone,
      doctorName: doctor.name,
      appointmentDate: saved.appointmentDate,
      appointmentTime: saved.appointmentTime,
    });

    return saved;
  }

  /**
   * Calcular horarios disponibles
   */
  async getAvailableSlots(doctorId: string, date: string) {
    const doctor = await this.doctorRepository.findOneBy({ id: doctorId });
    if (!doctor) {
      throw new NotFoundException(`Doctor con ID ${doctorId} no encontrado`);
    }

    // Obtener citas existentes
    const appointments = await this.appointmentRepository.find({
      where: {
        doctor: { id: doctorId },
        appointmentDate: date,
      },
    });

    // Regla de Negocio: Excepciones del médico
    const exception = await this.doctorExceptionRepository.findOneBy({
      doctorId: doctor.id,
      date: date,
    });
    if (exception) {
      return []; // No hay horarios si hay una excepción
    }

    const bookedSlots: string[] = appointments.map((a) =>
      a.appointmentTime.toString().slice(0, 5),
    );
    const slots: string[] = [];

    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    let dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0) dayOfWeek = 7; // Convertir 0 (Domingo) a 7

    // Regla de Negocio: Días laborables del médico
    const workingDaysArray = doctor.activeDays
      ? doctor.activeDays.split(',').map(Number)
      : [1, 2, 3, 4, 5];
    if (!workingDaysArray.includes(dayOfWeek)) {
      return []; // El médico no trabaja este día
    }

    let current = timeToMinutes(doctor.scheduleStart);
    const end = timeToMinutes(doctor.scheduleEnd);
    const breakStartMin = doctor.lunchStart
      ? timeToMinutes(doctor.lunchStart)
      : null;
    const breakEndMin = doctor.lunchEnd
      ? timeToMinutes(doctor.lunchEnd)
      : null;

    // Regla de Negocio: Ventana de tiempo
    const config = await this.configService.getConfig();
    const minAdvanceHours = config?.minAdvanceHours ?? 2;
    const appointmentWindowDays = config?.appointmentWindowDays ?? 15;

    while (current + doctor.slotDuration <= end) {
      const timeStr = minutesToTime(current);

      const now = new Date();
      const slotDate = new Date(`${date}T${timeStr}`);
      const diffHours = (slotDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      const horizonDate = new Date();
      horizonDate.setDate(now.getDate() + appointmentWindowDays);

      const isDuringBreak =
        breakStartMin !== null &&
        breakEndMin !== null &&
        current >= breakStartMin &&
        current < breakEndMin;

      if (
        !bookedSlots.includes(timeStr) &&
        diffHours >= minAdvanceHours &&
        slotDate <= horizonDate &&
        !isDuringBreak
      ) {
        slots.push(timeStr);
      }
      current += doctor.slotDuration;
    }

    return slots;
  }

  /**
   * Requisito 3: Listar mis citas (Paciente)
   */
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

  /**
   * Requisito 3: Cancelar cita (Paciente)
   */
  async cancelAppointment(appointmentId: string, patientId: string) {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: ['patient', 'doctor'],
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada.');
    }

    if (
      appointment.patient.id !== patientId &&
      appointment.patient.keycloakId !== patientId
    ) {
      throw new UnauthorizedException(
        'No tienes permiso para cancelar esta cita.',
      );
    }

    const now = new Date();
    const appDate = new Date(
      `${appointment.appointmentDate}T${appointment.appointmentTime}`,
    );

    if (appDate < now) {
      throw new BadRequestException('No se puede cancelar una cita pasada.');
    }

    appointment.status = 'cancelada';
    const saved = await this.appointmentRepository.save(appointment);

    this.emitEvent('appointment.cancelled', {
      appointmentId: saved.id,
      patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      patientPhone: appointment.patient.phone,
      doctorName: appointment.doctor.name,
      appointmentDate: saved.appointmentDate,
      appointmentTime: saved.appointmentTime,
    });

    return saved;
  }

  /**
   * Requisito 3 (Variante): Confirmar cita (Médico/Agendador)
   */
  async confirmAppointment(appointmentId: string) {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId }
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada.');
    }

    if (appointment.status === 'cancelada') {
      throw new BadRequestException('No se puede confirmar una cita cancelada.');
    }

    appointment.status = 'confirmada';
    return this.appointmentRepository.save(appointment);
  }

  /**
   * Requisito 3: Reagendar cita (Paciente)
   */
  async reschedule(id: string, patientId: string, date: string, time: string) {
  const appointment = await this.appointmentRepository.findOne({
    where: { id },
    relations: ['patient', 'doctor'],
  });

  if (!appointment) {
    throw new NotFoundException('Cita no encontrada.');
  }

  if (
    appointment.patient.id !== patientId &&
    appointment.patient.keycloakId !== patientId
  ) {
    throw new UnauthorizedException(
      'No tienes permiso para modificar esta cita.',
    );
  }

  // Verificar disponibilidad del NUEVO horario
  const existing = await this.appointmentRepository.findOneBy({
    doctor: { id: appointment.doctor.id },
    appointmentDate: date,
    appointmentTime: time,
  });

  if (existing && existing.id !== id) {
    throw new ConflictException('El nuevo horario elegido ya está ocupado.');
  }

  // Regla de Negocio: Ventana de tiempo (igual que al crear)
  const config = await this.configService.getConfig();
  const minAdvanceHours = config?.minAdvanceHours ?? 2;
  const appointmentWindowDays = config?.appointmentWindowDays ?? 15;

  const now = new Date();
  const newAppDate = new Date(`${date}T${time}`);

  const diffHours = (newAppDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (diffHours < minAdvanceHours) {
    throw new BadRequestException(
      `Debe reagendar con al menos ${minAdvanceHours} horas de antelación.`,
    );
  }

  const horizonDate = new Date();
  horizonDate.setDate(now.getDate() + appointmentWindowDays);
  if (newAppDate > horizonDate) {
    throw new BadRequestException(
      `No se puede reagendar con más de ${appointmentWindowDays} días de antelación.`,
    );
  }

  // Regla de Negocio: Excepciones del médico
  const exception = await this.doctorExceptionRepository.findOneBy({
    doctorId: appointment.doctor.id,
    date: date,
  });
  if (exception) {
    throw new BadRequestException(
      `El médico no atiende este día: ${exception.reason || 'No disponible'}`,
    );
  }

  appointment.appointmentDate = date;
  appointment.appointmentTime = time;
  appointment.status = 'agendada';

  const saved = await this.appointmentRepository.save(appointment);

  this.emitEvent('appointment.rescheduled', {
    appointmentId: saved.id,
    patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
    patientPhone: appointment.patient.phone,
    doctorName: appointment.doctor.name,
    appointmentDate: saved.appointmentDate,
    appointmentTime: saved.appointmentTime,
  });

  return saved;
  }

  async exportAppointmentsByDateAndDoctor(
    date: string,
    doctorId: string,
  ): Promise<string> {
    const appointments = await this.appointmentRepository.find({
      where: {
        appointmentDate: date,
        doctor: { id: doctorId },
      },
      relations: ['patient', 'doctor'],
      order: {
        appointmentTime: 'ASC',
      },
    });

    if (!appointments.length) {
      throw new NotFoundException('No hay citas para esa fecha');
    }

    const formatted = appointments.map((app) => ({
      Hora: app.appointmentTime,
      Paciente: `${app.patient.firstName} ${app.patient.lastName}`,
      Documento: app.patient.document,
      Telefono: app.patient.phone,
      Estado: app.status,
    }));

    const parser = new Parser({
      delimiter: ';',
    });
    return '\uFEFF' + parser.parse(formatted);
  }

  private emitEvent(pattern: string, data: Record<string, unknown>): void {
    try {
      this.notificationClient.emit(pattern, data);
    } catch (error) {
      console.error(`[Notification] Error emitiendo evento ${pattern}:`, error);
    }
  }

  /**
   * Requisito Adicional Fase 8: Estadísticas del sistema
   */
  async getDashboardStats() {
    const allAppointments = await this.appointmentRepository.find({
      relations: ['doctor'],
    });
    const allDoctors = await this.doctorRepository.find();

    const total = allAppointments.length;
    let scheduled = 0;
    let completed = 0;
    let cancelled = 0;

    const doctorCounts: Record<string, { name: string; count: number }> = {};
    allDoctors.forEach((d) => {
      doctorCounts[d.id] = { name: `Dr(a). ${d.name}`, count: 0 };
    });

    allAppointments.forEach((app) => {
      if (app.status === 'agendada') scheduled++;
      else if (app.status === 'completada') completed++;
      else if (app.status === 'cancelada') cancelled++;

      if (app.doctor && doctorCounts[app.doctor.id]) {
        doctorCounts[app.doctor.id].count++;
      }
    });

    const doctorStats = Object.values(doctorCounts)
      .map((d) => ({
        name: d.name,
        count: d.count,
        percentage: total > 0 ? Math.round((d.count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      stats: {
        total,
        scheduled: scheduled,
        completed: completed,
        cancelled: cancelled,
      },
      doctorStats,
    };
  }

  /**
   * Listar TODAS las citas (sin filtrar)
   */
  async findAll(skip = 0, take = 100) {
    return this.appointmentRepository.find({
      relations: ['doctor', 'patient'],
      order: { appointmentDate: 'DESC', appointmentTime: 'ASC' },
      skip,
      take,
    });
  }

  /**
   * Buscar cita por ID
   */
  async findById(id: string) {
    return this.appointmentRepository.findOneBy({ id });
  }

  /**
   * Buscar paciente por documento
   */
  async findPatientByDocument(document: string) {
    const patient = await this.patientRepository.findOneBy({ document });
    if (!patient) {
      throw new NotFoundException('Paciente no encontrado.');
    }
    return patient;
  }

  /**
   * Tarea programada: marca como completadas las citas que ya pasaron
   */
  async autoCompletePastAppointments() {
    const now = new Date();

    // Convertir la fecha actual local a formato YYYY-MM-DD
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Convertir la hora actual local a formato HH:mm
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    await this.appointmentRepository
      .createQueryBuilder()
      .update(Appointment)
      .set({ status: 'completada' })
      .where('status = :status', { status: 'agendada' })
      .andWhere(
        '(appointmentDate < :date OR (appointmentDate = :date AND appointmentTime < :time))',
        {
          date: dateStr,
          time: timeStr,
        },
      )
      .execute();
  }

  /**
   * Fase 3: Recordatorios automáticos – se ejecuta cada día a las 8:00 AM
   * Envía un evento por cada cita agendada del día siguiente.
   */
  @Cron('0 8 * * *')
  async sendReminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const tomorrowStr = `${year}-${month}-${day}`;

    const appointments = await this.appointmentRepository.find({
      where: { appointmentDate: tomorrowStr, status: 'agendada' },
      relations: ['patient', 'doctor'],
    });

    for (const app of appointments) {
      this.emitEvent('appointment.reminder', {
        appointmentId: app.id,
        patientName: `${app.patient.firstName} ${app.patient.lastName}`,
        patientPhone: app.patient.phone,
        doctorName: app.doctor.name,
        appointmentDate: app.appointmentDate,
        appointmentTime: app.appointmentTime,
      });
    }
  }
}
