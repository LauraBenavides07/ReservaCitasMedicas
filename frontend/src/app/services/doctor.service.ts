import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api-config';

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  scheduleStart: string;
  scheduleEnd: string;
  slotDuration: number;
  activeDays: number[];
  lunchStart?: string;
  lunchEnd?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private apiUrl = `${API_BASE_URL}/doctors`;

  constructor(private http: HttpClient) {}

  getDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(this.apiUrl);
  }

  createDoctor(data: Partial<Doctor>): Observable<Doctor> {
    return this.http.post<Doctor>(this.apiUrl, data);
  }

  updateDoctor(id: string, data: Partial<Doctor>): Observable<Doctor> {
    return this.http.patch<Doctor>(`${this.apiUrl}/${id}`, data);
  }

  deleteDoctor(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // --- Excepciones ---
  getExceptions(doctorId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${doctorId}/exceptions`);
  }

  addException(doctorId: string, data: { date: string, reason: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${doctorId}/exceptions`, data);
  }

  removeException(doctorId: string, exceptionId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${doctorId}/exceptions/${exceptionId}`);
  }
}
