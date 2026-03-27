import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GlobalConfig {
  id: string;
  minAdvanceHours: number;
  appointmentWindowWeeks: number;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private apiUrl = 'http://localhost:3000/configs';

  constructor(private http: HttpClient) {}

  getConfig(): Observable<GlobalConfig> {
    return this.http.get<GlobalConfig>(this.apiUrl);
  }

  updateConfig(data: Partial<GlobalConfig>): Observable<GlobalConfig> {
    return this.http.patch<GlobalConfig>(this.apiUrl, data);
  }
}
