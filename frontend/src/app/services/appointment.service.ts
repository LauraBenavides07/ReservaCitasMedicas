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

  rescheduleAppointment(id: string, date: string, time: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/reschedule`, { date, time });
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
}
