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
  comparison: {
    totalChange: number;
    scheduledChange: number;
    completedChange: number;
    cancelledChange: number;
  };
  doctorStats: { name: string; count: number; percentage: number }[];
  dailyTrend: { date: string; count: number }[];
  statusDistribution: { status: string; count: number }[];
  patientRecurrence: { newPatients: number; returningPatients: number };
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
    if (filter.doctorId) {
      where.doctor = { id: filter.doctorId };
    }

    let allAppointments = await this.appointmentRepository.find({
      where,
      relations: { doctor: true, patient: true },
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
    if (filter.status) {
      allAppointments = allAppointments.filter(
        (a) => a.status === filter.status,
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
    const patientIds = new Set<string>();
    const patientFirstAppt = new Map<string, Date>();

    allAppointments.forEach((app) => {
      if (app.status === AppointmentStatus.SCHEDULED) scheduled++;
      else if (app.status === AppointmentStatus.CONFIRMED) confirmed++;
      else if (app.status === AppointmentStatus.COMPLETED) completed++;
      else if (app.status === AppointmentStatus.CANCELLED) cancelled++;

      const day = app.appointmentDate;
      dailyMap[day] = (dailyMap[day] || 0) + 1;

      const statusKey = app.status;
      statusMap[statusKey] = (statusMap[statusKey] || 0) + 1;

      if (app.doctor && doctorCounts[app.doctor.id]) {
        doctorCounts[app.doctor.id].count++;
      }

      if (app.patient?.id) {
        patientIds.add(app.patient.id);
        const existing = patientFirstAppt.get(app.patient.id);
        if (!existing || new Date(app.createdAt) < existing) {
          patientFirstAppt.set(app.patient.id, new Date(app.createdAt));
        }
      }
    });

    const dailyTrend = Object.entries(dailyMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const statusDistribution = Object.entries(statusMap).map(
      ([status, count]) => ({ status, count }),
    );

    const filterStart = filter.startDate;
    const newPatients = filterStart
      ? allAppointments.filter((a) => {
          const firstDate = a.patient?.id
            ? patientFirstAppt.get(a.patient.id)
            : null;
          return firstDate && firstDate >= new Date(filterStart);
        }).length
      : 0;
    const returningPatients = patientIds.size - newPatients;

    const doctorStats = Object.values(doctorCounts)
      .map((d) => ({
        name: d.name,
        count: d.count,
        percentage: total > 0 ? Math.round((d.count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Comparison vs previous period
    let comparison = {
      totalChange: 0,
      scheduledChange: 0,
      completedChange: 0,
      cancelledChange: 0,
    };

    if (filter.startDate && filter.endDate) {
      const rangeMs =
        new Date(filter.endDate).getTime() -
        new Date(filter.startDate).getTime();
      const prevEnd = new Date(
        new Date(filter.startDate).getTime() - 1,
      ).toISOString().split('T')[0];
      const prevStart = new Date(
        new Date(filter.startDate).getTime() - rangeMs,
      ).toISOString().split('T')[0];

      const prevFilter = { ...filter, startDate: prevStart, endDate: prevEnd };
      const prevStats = await this.getDashboardStats(prevFilter);

      comparison = {
        totalChange: this.percentageChange(
          total,
          prevStats.stats.total,
        ),
        scheduledChange: this.percentageChange(
          scheduled + confirmed,
          prevStats.stats.scheduled + prevStats.stats.confirmed,
        ),
        completedChange: this.percentageChange(
          completed,
          prevStats.stats.completed,
        ),
        cancelledChange: this.percentageChange(
          cancelled,
          prevStats.stats.cancelled,
        ),
      };
    }

    return {
      stats: {
        total,
        scheduled,
        confirmed,
        completed,
        cancelled,
        cancellationRate: total > 0 ? Math.round((cancelled / total) * 100) : 0,
      },
      comparison,
      doctorStats,
      dailyTrend,
      statusDistribution,
      patientRecurrence: {
        newPatients: Math.max(0, newPatients),
        returningPatients: Math.max(0, returningPatients),
      },
    };
  }

  private percentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }
}
