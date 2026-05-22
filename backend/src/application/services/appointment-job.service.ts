import { Injectable, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AppointmentStatus } from '../../domain/types/appointment-status.enum';
import { NotificationService } from './notification.service';
import { IAppointmentRepository } from '../ports/appointment.repository';

@Injectable()
export class AppointmentJobService {
  constructor(
    @Inject(IAppointmentRepository)
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly notificationService: NotificationService,
  ) {}

  async autoCompletePastAppointments() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    await this.appointmentRepository
      .createQueryBuilder()
      .update()
      .set({ status: AppointmentStatus.COMPLETED })
      .where('status = :status', { status: AppointmentStatus.SCHEDULED })
      .andWhere(
        '(appointmentDate < :date OR (appointmentDate = :date AND appointmentTime < :time))',
        { date: dateStr, time: timeStr },
      )
      .execute();
  }

  @Cron('0 8 * * *')
  async sendReminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const tomorrowStr = `${year}-${month}-${day}`;

    const appointments = await this.appointmentRepository.find({
      where: {
        appointmentDate: tomorrowStr,
        status: AppointmentStatus.SCHEDULED,
      },
      relations: { patient: true, doctor: true },
    });

    for (const app of appointments) {
      this.notificationService.emit('appointment.reminder', {
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
