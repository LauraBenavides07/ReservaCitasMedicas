import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'staff' | 'doctor' | 'patient';
  document?: string;
  phone?: string;
  gender?: string;
  email?: string;
  birthDate?: string;
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

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password`, data);
  }

  login(data: any): Observable<AuthResponse & { mustChangePassword?: boolean }> {
    const payload = {
        login: data.login ? data.login.trim() : '',
        password: data.password ? data.password : ''
    };
    
    return this.http.post<AuthResponse & { mustChangePassword?: boolean }>(`${this.apiUrl}/login`, payload).pipe(
        tap(res => {
            console.log('Respuesta login:', res);
            
            if (res.mustChangePassword) {
                // Guardar token temporalmente para cambio de contraseña
                localStorage.setItem('temp_access_token', res.access_token);
                localStorage.setItem('temp_user', JSON.stringify(res.user));
                console.log('Credenciales temporales guardadas para cambio de contraseña');
            } else {
                // Sesión normal
                localStorage.setItem('access_token', res.access_token);
                localStorage.setItem('user', JSON.stringify(res.user));
                this._user.set(res.user);
            }
        })
    );
}

// Método para obtener token temporal
getTempToken(): string | null {
    return localStorage.getItem('temp_access_token');
}

// Método para obtener usuario temporal
getTempUser(): User | null {
    const userStr = localStorage.getItem('temp_user');
    return userStr ? JSON.parse(userStr) : null;
}

// ✅ Método para completar el cambio de contraseña
completePasswordChange(newToken: string, user: User): void {
    localStorage.removeItem('temp_access_token');
    localStorage.removeItem('temp_user');
    localStorage.setItem('access_token', newToken);
    localStorage.setItem('user', JSON.stringify(user));
    this._user.set(user);
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
    
    // Validar que exista, que no sea nulo y que no sea el texto literal "undefined"
    if (!userStr || userStr === 'undefined' || userStr === 'null') {
      return null;
    }

    try {
      return JSON.parse(userStr);
    } catch (e) {
      console.error('Error parseando el usuario desde localStorage:', e);
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getPatientByDocument(document: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/patient/${document}`);
  }
}
