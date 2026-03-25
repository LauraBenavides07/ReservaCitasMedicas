import { Injectable, ConflictException, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../../domain/entities/appointment.entity';
import { Patient } from '../../domain/entities/patient.entity';
import { Doctor } from '../../domain/entities/doctor.entity';
import { CreateAppointmentDto } from '../../presentation/dto/create-appointment.dto';
import { ConfigService } from './config.service';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    private configService: ConfigService,
  ) {}

  /**
   * Requisito 1: Listar citas por médico y fecha
   */
  async findAllByDoctorAndDate(doctorId: number, date: string) {
    const [appointments, total] = await this.appointmentRepository.findAndCount({
      where: {
        doctor: { id: doctorId },
        date: date,
      },
      relations: ['patient', 'doctor'],
      order: {
        time: 'ASC',
      },
    });

    return {
      appointments,
      total,
    };
  }

  /**
   * Requisito 2: Crear cita manual
   */
  async create(createDto: CreateAppointmentDto) {
    const doctor = await this.doctorRepository.findOneBy({ id: createDto.doctorId });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${createDto.doctorId} not found`);
    }

    // Regla de Negocio: Ventana de tiempo
    const config = await this.configService.getConfig();
    const minAdvanceHours = config?.minAdvanceHours ?? 2;
    const appointmentWindowWeeks = config?.appointmentWindowWeeks ?? 4;
    
    const now = new Date();
    const appointmentDate = new Date(`${createDto.date}T${createDto.time}`);
    
    const diffHours = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (diffHours < minAdvanceHours) {
      throw new BadRequestException(`Debe agendar con al menos ${minAdvanceHours} horas de antelación.`);
    }

    const horizonDate = new Date();
    horizonDate.setDate(now.getDate() + appointmentWindowWeeks * 7);
    if (appointmentDate > horizonDate) {
      throw new BadRequestException(`No se puede agendar con más de ${appointmentWindowWeeks} semanas de antelación.`);
    }

    // Verificar si existe el paciente, si no, crearlo
    let patient = await this.patientRepository.findOneBy({ document: createDto.patientDocument });
    if (!patient) {
      patient = this.patientRepository.create({
        document: createDto.patientDocument,
        firstName: createDto.firstName,
        lastName: createDto.lastName,
        phone: createDto.phone,
        gender: createDto.gender,
      });
      await this.patientRepository.save(patient);
    }

    // Verificar disponibilidad
    const existing = await this.appointmentRepository.findOneBy({
      doctor: { id: doctor.id },
      date: createDto.date,
      time: createDto.time,
    });

    if (existing) {
      throw new ConflictException('El horario ya está ocupado para este médico.');
    }

    const appointment = this.appointmentRepository.create({
      date: createDto.date,
      time: createDto.time,
      doctor: doctor,
      patient: patient,
      status: 'agendada',
    });

    return this.appointmentRepository.save(appointment);
  }

  /**
   * Calcular horarios disponibles
   */
  async getAvailableSlots(doctorId: number, date: string) {
    const doctor = await this.doctorRepository.findOneBy({ id: doctorId });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }

    // Obtener citas existentes
    const appointments = await this.appointmentRepository.find({
      where: {
        doctor: { id: doctorId },
        date: date,
      },
    });

    const bookedSlots: string[] = appointments.map((a) => a.time);
    const slots: string[] = [];

    const dateObj = new Date(`${date}T00:00:00`);
    let dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0) dayOfWeek = 7; // Convertir 0 (Domingo) a 7
    
    // Regla de Negocio: Días laborables del médico
    const workingDaysArray = doctor.workingDays ? doctor.workingDays.split(',').map(Number) : [1,2,3,4,5];
    if (!workingDaysArray.includes(dayOfWeek)) {
       return []; // El médico no trabaja este día
    }

    let current = this.timeToMinutes(doctor.startTime);
    const end = this.timeToMinutes(doctor.endTime);
    const breakStartMin = doctor.breakStart ? this.timeToMinutes(doctor.breakStart) : null;
    const breakEndMin = doctor.breakEnd ? this.timeToMinutes(doctor.breakEnd) : null;

    // Regla de Negocio: Ventana de tiempo
    const config = await this.configService.getConfig();
    const minAdvanceHours = config?.minAdvanceHours ?? 2;
    const appointmentWindowWeeks = config?.appointmentWindowWeeks ?? 4;

    while (current + doctor.appointmentDuration <= end) {
      const timeStr = this.minutesToTime(current);
      
      const now = new Date();
      const slotDate = new Date(`${date}T${timeStr}`);
      const diffHours = (slotDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      const horizonDate = new Date();
      horizonDate.setDate(now.getDate() + appointmentWindowWeeks * 7);

      const isDuringBreak = breakStartMin !== null && breakEndMin !== null && current >= breakStartMin && current < breakEndMin;

      if (!bookedSlots.includes(timeStr) && diffHours >= minAdvanceHours && slotDate <= horizonDate && !isDuringBreak) {
        slots.push(timeStr);
      }
      current += doctor.appointmentDuration;
    }

    return slots;
  }

  /**
   * Requisito 3: Listar mis citas (Paciente)
   */
  async findAllByPatient(patientId: number) {
    return this.appointmentRepository.find({
      where: { patient: { id: patientId } },
      relations: ['doctor'],
      order: { date: 'DESC', time: 'ASC' },
    });
  }

  /**
   * Requisito 3: Cancelar cita (Paciente)
   */
  async cancelAppointment(appointmentId: number, patientId: number) {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: ['patient'],
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada.');
    }

    if (appointment.patient.id !== patientId) {
      throw new UnauthorizedException('No tienes permiso para cancelar esta cita.');
    }

    const now = new Date();
    const appDate = new Date(`${appointment.date}T${appointment.time}`);
    
    if (appDate < now) {
      throw new BadRequestException('No se puede cancelar una cita pasada.');
    }

    appointment.status = 'cancelada';
    return this.appointmentRepository.save(appointment);
  }

  /**
   * Requisito 3: Reagendar cita (Paciente)
   */
  async reschedule(id: number, patientId: number, date: string, time: string) {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['patient', 'doctor'],
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada.');
    }

    if (appointment.patient.id !== patientId) {
      throw new UnauthorizedException('No tienes permiso para modificar esta cita.');
    }

    // Verificar disponibilidad del NUEVO horario
    const existing = await this.appointmentRepository.findOneBy({
      doctor: { id: appointment.doctor.id },
      date: date,
      time: time,
    });

    if (existing && existing.id !== id) {
      throw new ConflictException('El nuevo horario elegido ya está ocupado.');
    }

    const now = new Date();
    const newAppDate = new Date(`${date}T${time}`);
    if (newAppDate < now) {
      throw new BadRequestException('No se puede reagendar a una fecha pasada.');
    }

    appointment.date = date;
    appointment.time = time;
    appointment.status = 'agendada'; // Asegurar que pase de cancelada a agendada si fuera el caso
    
    return this.appointmentRepository.save(appointment);
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Requisito Adicional Fase 8: Estadísticas del sistema
   */
  async getDashboardStats() {
    const allAppointments = await this.appointmentRepository.find({ relations: ['doctor'] });
    const allDoctors = await this.doctorRepository.find();
    
    let total = allAppointments.length;
    let scheduled = 0;
    let completed = 0;
    let cancelled = 0;

    const doctorCounts: Record<number, { name: string, count: number }> = {};
    allDoctors.forEach(d => {
      doctorCounts[d.id] = { name: `Dr(a). ${d.name}`, count: 0 };
    });

    allAppointments.forEach(app => {
      if (app.status === 'agendada') scheduled++;
      else if (app.status === 'completada') completed++;
      else if (app.status === 'cancelada') cancelled++;
      
      if (app.doctor && doctorCounts[app.doctor.id]) {
         doctorCounts[app.doctor.id].count++;
      }
    });

    const doctorStats = Object.values(doctorCounts).map(d => ({
      name: d.name,
      count: d.count,
      percentage: total > 0 ? Math.round((d.count / total) * 100) : 0
    })).sort((a,b) => b.count - a.count);

    return {
      stats: { total, scheduled: scheduled, completed: completed, cancelled: cancelled },
      doctorStats
    };
  }
}
