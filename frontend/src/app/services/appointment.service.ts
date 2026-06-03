import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Doctor } from './doctor.service';
import { environment } from '../../environments/environment';

export interface Patient {
  id?: string;
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

export interface CreateAppointmentDto {
    patientDocument: string;
    firstName: string;
    lastName: string;
    phone: string;
    gender?: string;
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
  private apiUrl = `${environment.apiUrl}/appointments`;

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
    console.log('Enviando cita al backend:', JSON.stringify(appointment, null, 2));
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

  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
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

  private patientsApiUrl = `${environment.apiUrl}/patients`;

  updatePatientMedicalInfo(patientId: string, data: { diagnosis?: string; observations?: string }): Observable<any> {
    return this.http.patch(`${this.patientsApiUrl}/${patientId}/medical-info`, data);
  }

  getAllHistory(params?: {
    appointmentId?: string;
    changeType?: string;
    limit?: number;
    doctorId?: string;
    date?: string;
    search?: string;
  }): Observable<{ total: number; history: AppointmentHistoryEntry[] }> {
    let query = '';
    if (params?.appointmentId) query += `&appointmentId=${params.appointmentId}`;
    if (params?.changeType) query += `&changeType=${params.changeType}`;
    if (params?.limit) query += `&limit=${params.limit}`;
    if (params?.doctorId) query += `&doctorId=${params.doctorId}`;
    if (params?.date) query += `&date=${params.date}`;
    if (params?.search) query += `&search=${encodeURIComponent(params.search)}`;
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
  doctorSpecialty?: string | null;
  patientName?: string;
  patientDocument?: string | null;
}