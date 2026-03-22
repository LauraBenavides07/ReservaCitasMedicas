import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  role: 'admin' | 'staff' | 'doctor' | 'patient';
  document?: string;
  phone?: string;
  gender?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth';
  private _user = signal<User | null>(this.getUserFromStorage());
  
  user = computed(() => this._user());
  isLoggedIn = computed(() => !!this._user());

  constructor(private http: HttpClient) {
    // Limpiar claves antiguas si existen para evitar conflictos
    localStorage.removeItem('patient');
  }

  register(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(res => this.setSession(res))
    );
  }

  login(data: any): Observable<AuthResponse> {
    // Limpieza de espacios en blanco
    const payload = {
      login: data.login ? data.login.trim() : '',
      password: data.password ? data.password : ''
    };
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, payload).pipe(
      tap(res => this.setSession(res))
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    this._user.set(null);
  }

  private setSession(res: AuthResponse): void {
    localStorage.setItem('access_token', res.access_token);
    localStorage.setItem('user', JSON.stringify(res.user));
    this._user.set(res.user);
  }

  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }
}
