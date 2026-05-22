import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Doctor } from './doctor.service';

export interface Patient {
  firstName: string;
  lastName: string;
  document: string;
  phone: string;
}

export interface Appointment {
  id: string;
  time: string;
  date: string;
  appointmentTime?: string;
  appointmentDate?: string;
  status: string;
  patient: Patient;
  doctor?: Doctor;
  observations?: string;
  diagnosis?: string;
}

export interface AppointmentResponse {
  appointments: Appointment[];
  total: number;
}

export interface DashboardStatsFilter {
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

export interface CreateAppointmentDto {
  patientDocument: string;
  firstName: string;
  lastName: string;
  phone: string;
  gender: string;
  birthDate?: string;
  email?: string;
  doctorId: string;
  date: string;
  time: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = 'http://localhost:3000/appointments';

  constructor(private http: HttpClient) {}

  getAppointments(doctorId: string, date: string): Observable<AppointmentResponse> {
    return this.http.get<AppointmentResponse>(`${this.apiUrl}?doctorId=${doctorId}&date=${date}`);
  }

  exportAppointments(date: string, doctorId: string) {
    return this.http.get(
      `${this.apiUrl}/export?date=${date}&doctorId=${doctorId}`,
      {
        responseType: 'blob'
      }
    );
  }

  getAvailableSlots(doctorId: string, date: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/available-slots?doctorId=${doctorId}&date=${date}`);
  }

  createAppointment(appointment: CreateAppointmentDto): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiUrl, appointment);
  }

  getPatientAppointments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my-appointments`);
  }

  cancelAppointment(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/cancel`, {});
  }

  confirmAppointment(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/confirm`, {});
  }

  rescheduleAppointment(id: string, date: string, time: string, doctorId?: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/reschedule`, { date, time, doctorId });
  }

  getDashboardStats(filter?: DashboardStatsFilter): Observable<DashboardStats> {
    const params: any = {};
    if (filter?.startDate) params.startDate = filter.startDate;
    if (filter?.endDate) params.endDate = filter.endDate;
    if (filter?.doctorId) params.doctorId = filter.doctorId;
    if (filter?.status) params.status = filter.status;
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`, { params });
  }

  getAllAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/all`);
  }

  getPatientByDocument(document: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/patient-by-document/${document}`);
  }

  completeAppointment(id: string, observations?: string, diagnosis?: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/complete`, { observations, diagnosis });
  }

  getAppointmentHistory(id: string): Observable<AppointmentHistoryEntry[]> {
    return this.http.get<AppointmentHistoryEntry[]>(`${this.apiUrl}/${id}/history`);
  }

  getAllHistory(params?: { appointmentId?: string; changeType?: string; limit?: number }): Observable<{ total: number; history: AppointmentHistoryEntry[] }> {
    let query = '';
    if (params?.appointmentId) query += `&appointmentId=${params.appointmentId}`;
    if (params?.changeType) query += `&changeType=${params.changeType}`;
    if (params?.limit) query += `&limit=${params.limit}`;
    return this.http.get<{ total: number; history: AppointmentHistoryEntry[] }>(`${this.apiUrl}/history/all?${query}`);
  }
}

export interface AppointmentHistoryEntry {
  id: string;
  appointmentId: string;
  changeType: 'CREATED' | 'RESCHEDULED' | 'CANCELLED' | 'CONFIRMED' | 'COMPLETED';
  previousDate: string | null;
  previousTime: string | null;
  previousStatus: string | null;
  newDate: string | null;
  newTime: string | null;
  newStatus: string | null;
  changedBy: string;
  changedByRole: string;
  reason: string | null;
  changedAt: string;
  doctorName?: string;
  patientName?: string;
}
