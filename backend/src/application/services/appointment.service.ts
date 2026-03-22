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
    const maxFutureDays = config?.maxFutureDays ?? 30;
    
    const now = new Date();
    const appointmentDate = new Date(`${createDto.date}T${createDto.time}`);
    
    const diffHours = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (diffHours < minAdvanceHours) {
      throw new BadRequestException(`Debe agendar con al menos ${minAdvanceHours} horas de antelación.`);
    }

    const horizonDate = new Date();
    horizonDate.setDate(now.getDate() + maxFutureDays);
    if (appointmentDate > horizonDate) {
      throw new BadRequestException(`No se puede agendar con más de ${maxFutureDays} días de antelación.`);
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

    let current = this.timeToMinutes(doctor.startTime);
    const end = this.timeToMinutes(doctor.endTime);

    // Regla de Negocio: Ventana de tiempo
    const config = await this.configService.getConfig();
    const minAdvanceHours = config?.minAdvanceHours ?? 2;
    const maxFutureDays = config?.maxFutureDays ?? 30;

    while (current + doctor.appointmentDuration <= end) {
      const timeStr = this.minutesToTime(current);
      
      const now = new Date();
      const slotDate = new Date(`${date}T${timeStr}`);
      const diffHours = (slotDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      const horizonDate = new Date();
      horizonDate.setDate(now.getDate() + maxFutureDays);

      if (!bookedSlots.includes(timeStr) && diffHours >= minAdvanceHours && slotDate <= horizonDate) {
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
}
