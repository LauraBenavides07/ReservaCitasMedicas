import { Injectable, Inject } from '@nestjs/common';
import { AppointmentStatus } from '../../domain/types/appointment-status.enum';
import { IAppointmentRepository } from '../ports/appointment.repository';
import { IDoctorRepository } from '../ports/doctor.repository';

export interface StatsFilter {
  startDate?: string;
  endDate?: string;
  doctorId?: string;
  status?: string;
}

export interface DashboardStats {
  stats: {
    total: number;
    scheduled: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    cancellationRate: number;
  };
  doctorStats: { name: string; count: number; percentage: number }[];
  dailyTrend: { date: string; count: number }[];
  statusDistribution: { status: string; count: number }[];
}

@Injectable()
export class StatsService {
  constructor(
    @Inject(IAppointmentRepository)
    private readonly appointmentRepository: IAppointmentRepository,
    @Inject(IDoctorRepository)
    private readonly doctorRepository: IDoctorRepository,
  ) {}

  async getDashboardStats(filter: StatsFilter = {}): Promise<DashboardStats> {
    const allDoctors = await this.doctorRepository.find();

    const where: any = {};
    if (filter.doctorId) where.doctor = { id: filter.doctorId };
    if (filter.status) where.status = filter.status;

    let allAppointments = await this.appointmentRepository.find({
      where,
      relations: { doctor: true },
      order: { appointmentDate: 'ASC' },
    });

    if (filter.startDate) {
      allAppointments = allAppointments.filter(
        (a) => a.appointmentDate >= filter.startDate!,
      );
    }
    if (filter.endDate) {
      allAppointments = allAppointments.filter(
        (a) => a.appointmentDate <= filter.endDate!,
      );
    }

    const total = allAppointments.length;
    let scheduled = 0;
    let confirmed = 0;
    let completed = 0;
    let cancelled = 0;

    const doctorCounts: Record<string, { name: string; count: number }> = {};
    allDoctors.forEach((d) => {
      doctorCounts[d.id] = { name: `Dr(a). ${d.name}`, count: 0 };
    });

    const dailyMap: Record<string, number> = {};
    const statusMap: Record<string, number> = {};

    allAppointments.forEach((app) => {
      if (app.status === AppointmentStatus.SCHEDULED) scheduled++;
      else if (app.status === AppointmentStatus.CONFIRMED) confirmed++;
      else if (app.status === AppointmentStatus.COMPLETED) completed++;
      else if (app.status === AppointmentStatus.CANCELLED) cancelled++;

      dailyMap[app.appointmentDate] = (dailyMap[app.appointmentDate] || 0) + 1;
      statusMap[app.status] = (statusMap[app.status] || 0) + 1;

      if (app.doctor && doctorCounts[app.doctor.id]) {
        doctorCounts[app.doctor.id].count++;
      }
    });

    const dailyTrend = Object.entries(dailyMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const statusDistribution = Object.entries(statusMap).map(
      ([status, count]) => ({ status, count }),
    );

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
        scheduled,
        confirmed,
        completed,
        cancelled,
        cancellationRate: total > 0 ? Math.round((cancelled / total) * 100) : 0,
      },
      doctorStats,
      dailyTrend,
      statusDistribution,
    };
  }
}
