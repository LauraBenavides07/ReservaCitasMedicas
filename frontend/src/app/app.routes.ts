import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent) },
  {
    path: 'appointments/list',
    loadComponent: () => import('./components/appointment-list/appointment-list.component').then(m => m.AppointmentListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'appointments/create',
    loadComponent: () => import('./components/appointment-form/appointment-form.component').then(m => m.AppointmentFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin/config',
    loadComponent: () => import('./components/admin-config/admin-config.component').then(m => m.AdminConfigComponent),
    canActivate: [roleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'patient/dashboard',
    loadComponent: () => import('./components/patient-dashboard/patient-dashboard.component').then(m => m.PatientDashboardComponent),
    canActivate: [roleGuard],
    data: { role: 'patient' }
  },
  {
    path: 'patient/appointments/create',
    loadComponent: () => import('./components/patient-appointment-form/patient-appointment-form.component').then(m => m.PatientAppointmentFormComponent),
    canActivate: [roleGuard],
    data: { role: 'patient' }
  },
  {
    path: 'doctor/dashboard',
    loadComponent: () => import('./components/doctor-dashboard/doctor-dashboard.component').then(m => m.DoctorDashboardComponent),
    canActivate: [roleGuard],
    data: { role: 'doctor' }
  },
  {
    path: 'doctor/patients',
    loadComponent: () => import('./components/doctor-patients/doctor-patients.component').then(m => m.DoctorPatientsComponent),
    canActivate: [roleGuard],
    data: { role: 'doctor' }
  },
  {
    path: 'doctor/history',
    loadComponent: () => import('./components/doctor-history/doctor-history.component').then(m => m.DoctorHistoryComponent),
    canActivate: [roleGuard],
    data: { role: 'doctor' }
  },
  { path: '**', redirectTo: '/login' }
];