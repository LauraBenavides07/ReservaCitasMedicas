import { Injectable, Inject } from '@nestjs/common';
import { AppointmentStatus } from '../../domain/types/appointment-status.enum';
import { IAppointmentRepository } from '../ports/appointment.repository';
import { IDoctorRepository } from '../ports/doctor.repository';

@Injectable()
export class StatsService {
  constructor(
    @Inject(IAppointmentRepository)
    private readonly appointmentRepository: IAppointmentRepository,
    @Inject(IDoctorRepository)
    private readonly doctorRepository: IDoctorRepository,
  ) {}

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
      if (app.status === AppointmentStatus.SCHEDULED) scheduled++;
      else if (app.status === AppointmentStatus.COMPLETED) completed++;
      else if (app.status === AppointmentStatus.CANCELLED) cancelled++;

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
      stats: { total, scheduled, completed, cancelled },
      doctorStats,
    };
  }
}
