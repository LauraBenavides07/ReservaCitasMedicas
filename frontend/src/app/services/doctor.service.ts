import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  startTime: string;
  endTime: string;
  appointmentDuration: number;
  workingDays: string;
  breakStart?: string;
  breakEnd?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private apiUrl = 'http://localhost:3000/doctors';

  constructor(private http: HttpClient) {}

  getDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(this.apiUrl);
  }

  createDoctor(data: Partial<Doctor>): Observable<Doctor> {
    return this.http.post<Doctor>(this.apiUrl, data);
  }

  updateDoctor(id: number, data: Partial<Doctor>): Observable<Doctor> {
    return this.http.patch<Doctor>(`${this.apiUrl}/${id}`, data);
  }

  deleteDoctor(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
