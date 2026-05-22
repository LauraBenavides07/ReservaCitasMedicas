import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { Doctor } from '../../domain/entities/doctor.entity';
import { ConfigService } from './config.service';
import { timeToMinutes, minutesToTime } from '../utils/time.utils';
import { IAppointmentRepository } from '../ports/appointment.repository';
import { IDoctorRepository } from '../ports/doctor.repository';
import { IDoctorExceptionRepository } from '../ports/doctor-exception.repository';

@Injectable()
export class AvailabilityService {
  constructor(
    @Inject(IAppointmentRepository)
    private readonly appointmentRepository: IAppointmentRepository,
    @Inject(IDoctorRepository)
    private readonly doctorRepository: IDoctorRepository,
    @Inject(IDoctorExceptionRepository)
    private readonly doctorExceptionRepository: IDoctorExceptionRepository,
    private readonly configService: ConfigService,
  ) {}

  async getAvailableSlots(doctorId: string, date: string): Promise<string[]> {
    const doctor = await this.doctorRepository.findOneBy({ id: doctorId });
    if (!doctor) {
      throw new NotFoundException(`Doctor con ID ${doctorId} no encontrado`);
    }

    const exception = await this.doctorExceptionRepository.findOneBy({
      doctorId: doctor.id,
      date,
    });
    if (exception) {
      return [];
    }

    if (!doctor.isWorkingDay(date)) {
      return [];
    }

    const appointments = await this.appointmentRepository.find({
      where: { doctor: { id: doctorId }, appointmentDate: date },
    });

    const bookedSlots: string[] = appointments.map((a) =>
      a.appointmentTime.toString().slice(0, 5),
    );

    const config = await this.configService.getConfig();
    const minAdvanceHours = config.minAdvanceHours;
    const appointmentWindowDays = config.appointmentWindowDays;

    const slots: string[] = [];
    let current = doctor.scheduleStartMinutes();
    const end = doctor.scheduleEndMinutes();
    const breakStart = doctor.lunchStartMinutes();
    const breakEnd = doctor.lunchEndMinutes();

    while (current + doctor.slotDuration <= end) {
      const timeStr = minutesToTime(current);

      const now = new Date();
      const slotDate = new Date(`${date}T${timeStr}`);
      const diffHours = (slotDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      const horizonDate = new Date();
      horizonDate.setDate(now.getDate() + appointmentWindowDays);

      const isDuringBreak =
        breakStart !== null &&
        breakEnd !== null &&
        current >= breakStart &&
        current < breakEnd;

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

  async validateTimeWindow(date: string, time: string): Promise<void> {
    const config = await this.configService.getConfig();
    const minAdvanceHours = config.minAdvanceHours;
    const appointmentWindowDays = config.appointmentWindowDays;

    const now = new Date();
    const appointmentDate = new Date(`${date}T${time}`);
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
  }

  async validateDoctorException(doctorId: string, date: string): Promise<void> {
    const exception = await this.doctorExceptionRepository.findOneBy({
      doctorId,
      date,
    });
    if (exception) {
      throw new BadRequestException(
        `El médico no atiende este día: ${exception.reason || 'No disponible'}`,
      );
    }
  }

  async isSlotAvailable(
    doctorId: string,
    date: string,
    time: string,
    excludeId?: string,
  ): Promise<boolean> {
    if (excludeId) {
      const existing = await this.appointmentRepository.findOne({
        where: {
          doctor: { id: doctorId },
          appointmentDate: date,
          appointmentTime: time,
        },
      });
      return !existing || existing.id === excludeId;
    }
    const existing = await this.appointmentRepository.findOneBy({
      doctor: { id: doctorId },
      appointmentDate: date,
      appointmentTime: time,
    });
    return !existing;
  }

  async assertSlotAvailable(
    doctorId: string,
    date: string,
    time: string,
    excludeId?: string,
  ): Promise<void> {
    const available = await this.isSlotAvailable(
      doctorId,
      date,
      time,
      excludeId,
    );
    if (!available) {
      throw new BadRequestException(
        'El horario ya está ocupado para este médico.',
      );
    }
  }
}
