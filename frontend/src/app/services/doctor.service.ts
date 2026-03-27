import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  scheduleStart: string;
  scheduleEnd: string;
  slotDuration: number;
  activeDays: string;
  lunchStart?: string;
  lunchEnd?: string;
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

  updateDoctor(id: string, data: Partial<Doctor>): Observable<Doctor> {
    return this.http.patch<Doctor>(`${this.apiUrl}/${id}`, data);
  }

  deleteDoctor(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
