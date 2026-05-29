import { Component, signal, effect, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { AppointmentListComponent } from './components/appointment-list/appointment-list.component';
import { AppointmentFormComponent } from './components/appointment-form/appointment-form.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { PatientDashboardComponent } from './components/patient-dashboard/patient-dashboard.component';
import { AdminConfigComponent } from './components/admin-config/admin-config.component';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { AuthService } from './services/auth.service';
import { PatientAppointmentFormComponent } from './components/patient-appointment-form/patient-appointment-form.component';
import { DoctorDashboardComponent } from './components/doctor-dashboard/doctor-dashboard.component';
import { DoctorPatientsComponent } from './components/doctor-patients/doctor-patients.component';
import { DoctorHistoryComponent } from './components/doctor-history/doctor-history.component';
import { AdminAuditComponent } from './components/admin-audit/admin-audit.component';
import { ButtonComponent } from './shared/atoms/button/button.component';
import { ChangePasswordComponent } from './components/change-password/change-password.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    ButtonComponent,
    CommonModule,
    AppointmentListComponent,
    AppointmentFormComponent,
    LoginComponent,
    RegisterComponent,
    PatientDashboardComponent,
    AdminConfigComponent,
    LandingPageComponent,
    PatientAppointmentFormComponent,
    DoctorDashboardComponent,
    DoctorPatientsComponent,
    DoctorHistoryComponent,
    AdminAuditComponent,
    ChangePasswordComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  // Inyección del servicio de autenticación
  auth = inject(AuthService);
  private router = inject(Router);

  // Señal que controla la vista actual de la aplicación
  view = signal<'landing' | 'admin-list' | 'admin-create' | 'admin-config' | 'admin-audit' | 'login' | 'register' | 'patient-dashboard' | 'patient-create' | 'doctor-dashboard' | 'doctor-create' | 'doctor-patients' | 'doctor-history' | 'doctor-search' | 'change-password'>('landing');
  // Estado para el menú móvil
  isMobileMenuOpen = signal(false);

  private readonly routeMap: Record<string, string> = {
    '/login': 'login',
    '/change-password': 'change-password',
    '/register': 'register',
    '/appointments/list': 'admin-list',
    '/appointments/create': 'admin-create',
    '/admin/config': 'admin-config',
    '/admin/audit': 'admin-audit',
    '/patient/dashboard': 'patient-dashboard',
    '/patient/appointments/create': 'patient-create',
    '/doctor/dashboard': 'doctor-dashboard',
    '/doctor/patients': 'doctor-patients',
    '/doctor/history': 'doctor-history',
  };

  ngOnInit(): void {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: NavigationEnd) => {
      const mapped = this.routeMap[e.urlAfterRedirects];
      if (mapped) {
        this.view.set(mapped as any);
      }
    });
  }

  constructor() {
    effect(() => {
      const user = this.auth.user();

      if (!user) {
        const v = this.view();
        if (v !== 'login' && v !== 'register' && v !== 'landing' && v !== 'change-password') {
          this.view.set('landing');
          this.router.navigate(['/']);
        }
        return;
      }

      const currentView = this.view();
      if (currentView === 'login' || currentView === 'register' || currentView === 'landing' || currentView === 'change-password') {
        if (user.role === 'patient') {
          this.view.set('patient-dashboard');
          this.router.navigate(['/patient/dashboard']);
        } else if (user.role === 'doctor') {
          this.view.set('doctor-dashboard');
          this.router.navigate(['/doctor/dashboard']);
        } else {
          this.view.set('admin-list');
          this.router.navigate(['/appointments/list']);
        }
      }
    });
  }

  logout(): void {
    this.auth.logout();
    this.view.set('landing');
    this.router.navigate(['/']);
  }

  // Método seguro para cambiar de vista desde HTML sin problemas de tipos estrictos
  changeView(newView: any): void {
    this.view.set(newView);
    this.isMobileMenuOpen.set(false); // Cierra el menú móvil al cambiar de vista
  }

  // Método para alternar el menú móvil
  toggleMobileMenu(): void {
    this.isMobileMenuOpen.set(!this.isMobileMenuOpen());
  }
}