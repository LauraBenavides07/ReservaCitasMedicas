import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AppointmentListComponent } from './components/appointment-list/appointment-list.component';
import { AppointmentFormComponent } from './components/appointment-form/appointment-form.component';
import { AdminConfigComponent } from './components/admin-config/admin-config.component';
import { PatientDashboardComponent } from './components/patient-dashboard/patient-dashboard.component';
import { PatientAppointmentFormComponent } from './components/patient-appointment-form/patient-appointment-form.component';
import { DoctorDashboardComponent } from './components/doctor-dashboard/doctor-dashboard.component';
import { DoctorPatientsComponent } from './components/doctor-patients/doctor-patients.component';
import { DoctorHistoryComponent } from './components/doctor-history/doctor-history.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'appointments/list', component: AppointmentListComponent },
  { path: 'appointments/create', component: AppointmentFormComponent },
  { path: 'admin/config', component: AdminConfigComponent },
  { path: 'patient/dashboard', component: PatientDashboardComponent },
  { path: 'patient/appointments/create', component: PatientAppointmentFormComponent },
  { path: 'doctor/dashboard', component: DoctorDashboardComponent },
  { path: 'doctor/patients', component: DoctorPatientsComponent },
  { path: 'doctor/history', component: DoctorHistoryComponent },
  { path: '**', redirectTo: '/login' }
];