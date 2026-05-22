import { Injectable, Inject } from '@nestjs/common';
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
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

    const currentWhere: any = {};
    if (filter.doctorId) currentWhere.doctor = { id: filter.doctorId };
    if (filter.status) currentWhere.status = filter.status;
    if (filter.startDate && filter.endDate) {
      currentWhere.appointmentDate = Between(filter.startDate, filter.endDate);
    } else if (filter.startDate) {
      currentWhere.appointmentDate = MoreThanOrEqual(filter.startDate);
    } else if (filter.endDate) {
      currentWhere.appointmentDate = LessThanOrEqual(filter.endDate);
    }

    const allAppointments = await this.appointmentRepository.find({
      where: currentWhere,
      relations: { doctor: true, patient: true },
      order: { appointmentDate: 'ASC' },
    });

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

      const day = app.appointmentDate;
      dailyMap[day] = (dailyMap[day] || 0) + 1;

      const statusKey = app.status;
      statusMap[statusKey] = (statusMap[statusKey] || 0) + 1;

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

    // Patient recurrence: count patients whose first appointment (ever) is within the filter range
    const patientIds = new Set<string>();
    const patientFirstEver = new Map<string, string>();
    allAppointments.forEach((app) => {
      if (app.patient?.id) {
        patientIds.add(app.patient.id);
        const existing = patientFirstEver.get(app.patient.id);
        if (!existing || app.appointmentDate < existing) {
          patientFirstEver.set(app.patient.id, app.appointmentDate);
        }
      }
    });

    let newPatients = 0;
    if (filter.startDate) {
      for (const firstDate of patientFirstEver.values()) {
        if (firstDate >= filter.startDate) newPatients++;
      }
    }
    const returningPatients = patientIds.size - newPatients;

    // Comparison vs previous period — lightweight query (no relations)
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

      const prevWhere: any = {};
      if (filter.doctorId) prevWhere.doctor = { id: filter.doctorId };
      if (filter.status) prevWhere.status = filter.status;
      prevWhere.appointmentDate = Between(prevStart, prevEnd);

      const prevAppointments = await this.appointmentRepository.find({
        where: prevWhere,
        select: { status: true },
      });

      let pTotal = 0;
      let pScheduled = 0;
      let pConfirmed = 0;
      let pCompleted = 0;
      let pCancelled = 0;
      prevAppointments.forEach((app) => {
        pTotal++;
        if (app.status === AppointmentStatus.SCHEDULED) pScheduled++;
        else if (app.status === AppointmentStatus.CONFIRMED) pConfirmed++;
        else if (app.status === AppointmentStatus.COMPLETED) pCompleted++;
        else if (app.status === AppointmentStatus.CANCELLED) pCancelled++;
      });

      comparison = {
        totalChange: this.percentageChange(total, pTotal),
        scheduledChange: this.percentageChange(scheduled + confirmed, pScheduled + pConfirmed),
        completedChange: this.percentageChange(completed, pCompleted),
        cancelledChange: this.percentageChange(cancelled, pCancelled),
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
