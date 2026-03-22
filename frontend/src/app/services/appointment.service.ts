import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Patient {
  firstName: string;
  lastName: string;
  document: string;
  phone: string;
}

export interface Appointment {
  id: number;
  time: string;
  date: string;
  status: string;
  patient: Patient;
}

export interface AppointmentResponse {
  appointments: Appointment[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = 'http://localhost:3000/appointments';

  constructor(private http: HttpClient) {}

  getAppointments(doctorId: number, date: string): Observable<AppointmentResponse> {
    return this.http.get<AppointmentResponse>(`${this.apiUrl}?doctorId=${doctorId}&date=${date}`);
  }
}
