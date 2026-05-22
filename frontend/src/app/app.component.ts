import { Component, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

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
import { AppointmentHistoryTimelineComponent } from './components/appointment-history-timeline/appointment-history-timeline.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
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
    AppointmentHistoryTimelineComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  // Inyección del servicio de autenticación
  auth = inject(AuthService);

  // Señal que controla la vista actual de la aplicación
  // Posibles valores: 'landing', 'admin-list', 'admin-create', 'admin-config', 
  // 'login', 'register', 'patient-dashboard', 'patient-create', 'doctor-dashboard', 'doctor-patients', 'doctor-history'
  view = signal<'landing' | 'admin-list' | 'admin-create' | 'admin-config' | 'admin-audit' | 'login' | 'register' | 'patient-dashboard' | 'patient-create' | 'doctor-dashboard' | 'doctor-create' | 'doctor-patients' | 'doctor-history' | 'doctor-search'>('landing');

  // Estado para el menú móvil
  isMobileMenuOpen = signal(false);

  constructor() {
    // Efecto reactivo que se ejecuta cada vez que cambia el usuario autenticado
    effect(() => {
      const user = this.auth.user();

      // Caso: usuario no autenticado
      if (!user) {
        const v = this.view();
        // Si la vista actual no es login, register o landing, redirige a landing
        if (v !== 'login' && v !== 'register' && v !== 'landing') {
          this.view.set('landing');
        }
        return;
      }

      // Caso: usuario autenticado recién logueado
      // Si está en una vista de autenticación o landing, redirige según su rol
      const currentView = this.view();
      if (currentView === 'login' || currentView === 'register' || currentView === 'landing') {
        if (user.role === 'patient') {
          this.view.set('patient-dashboard');
        } else if (user.role === 'doctor') {
          this.view.set('doctor-dashboard');
        } else {
          this.view.set('admin-list');
        }
      }
    });
  }

  // Método para cerrar sesión
  logout(): void {
    this.auth.logout();
    this.view.set('landing');
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