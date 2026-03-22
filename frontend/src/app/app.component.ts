import { Component, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentListComponent } from './components/appointment-list/appointment-list.component';
import { AppointmentFormComponent } from './components/appointment-form/appointment-form.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { PatientDashboardComponent } from './components/patient-dashboard/patient-dashboard.component';
import { AdminConfigComponent } from './components/admin-config/admin-config.component';
import { AuthService } from './services/auth.service';

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
    AdminConfigComponent
  ],
  template: `
    <header class="bg-primary shadow">
      <div class="container header-content">
        <div class="header-main">
          <div>
            <h1 class="title">Piedrazul</h1>
            <p class="subtitle">Gestión de Citas Médicas</p>
          </div>
          
          <div class="user-status" *ngIf="auth.isLoggedIn()">
            <span>Hola, <strong>{{ auth.user()?.firstName }}</strong></span>
            <button (click)="logout()" class="btn-logout">Salir</button>
          </div>
        </div>
        
        <nav class="nav-menu">
          <!-- Vistas Públicas (No Logged In) -->
          <ng-container *ngIf="!auth.isLoggedIn()">
            <div class="nav-spacer"></div>
            <button (click)="view.set('login')" [class.active]="view() === 'login'" class="btn-accent">
              Ingreso General
            </button>
            <button (click)="view.set('register')" [class.active]="view() === 'register'" class="btn-accent">
              Registro Paciente
            </button>
          </ng-container>

          <!-- Vistas de Admin / Staff -->
          <ng-container *ngIf="auth.isLoggedIn() && auth.user()?.role !== 'patient'">
            <button (click)="view.set('admin-list')" [class.active]="view() === 'admin-list'">
              Listar Citas
            </button>
            <button (click)="view.set('admin-create')" [class.active]="view() === 'admin-create'">
              Cita Manual (WA)
            </button>
            <button *ngIf="auth.user()?.role === 'admin'" (click)="view.set('admin-config')" [class.active]="view() === 'admin-config'">
              Configuración
            </button>
          </ng-container>

          <!-- Vistas de Paciente -->
          <ng-container *ngIf="auth.isLoggedIn() && auth.user()?.role === 'patient'">
            <button (click)="view.set('patient-dashboard')" [class.active]="view() === 'patient-dashboard'">
              Mis Citas
            </button>
            <button (click)="view.set('patient-create')" [class.active]="view() === 'patient-create'">
              Nueva Cita
            </button>
          </ng-container>
        </nav>
      </div>
    </header>
    
    <main class="container py-3">
      <!-- Admin Views -->
      <div *ngIf="view() === 'admin-list'">
        <app-appointment-list></app-appointment-list>
      </div>
      <div *ngIf="view() === 'admin-create'">
        <app-appointment-form></app-appointment-form>
      </div>

      <!-- Auth Views -->
      <div *ngIf="view() === 'login'">
        <app-login></app-login>
      </div>
      <div *ngIf="view() === 'register'">
        <app-register></app-register>
      </div>

      <!-- Admin Config View -->
      <div *ngIf="view() === 'admin-config'">
        <app-admin-config></app-admin-config>
      </div>

      <!-- Patient Views -->
      <div *ngIf="view() === 'patient-dashboard'">
        <app-patient-dashboard></app-patient-dashboard>
      </div>
      <div *ngIf="view() === 'patient-create'">
        <div class="patient-booking-wrapper">
          <h2 class="text-primary">Agendar Nueva Cita</h2>
          <app-appointment-form [isPatientView]="true"></app-appointment-form>
        </div>
      </div>
    </main>

    <footer class="container py-3 text-center">
      <p>&copy; 2026 Piedrazul - Sistema de Gestión de Citas Médicas</p>
    </footer>
  `,
  styles: [`
    header {
      padding: 1.5rem 0;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
      color: white;
    }
    .header-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .header-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .user-status {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: rgba(0,0,0,0.1);
      padding: 0.5rem 1rem;
      border-radius: 8px;
    }
    .btn-logout {
      background: white;
      color: #c62828;
      border: none;
      padding: 0.3rem 0.8rem;
      border-radius: 4px;
      font-weight: bold;
      cursor: pointer;
    }
    .title {
      margin: 0;
      font-size: 2.2rem;
      font-weight: 800;
      letter-spacing: -1px;
    }
    .subtitle {
      margin: 0;
      font-size: 1rem;
      opacity: 0.9;
    }
    .nav-menu {
      display: flex;
      gap: 0.8rem;
      margin-top: 1rem;
      flex-wrap: wrap;
    }
    .nav-menu button {
      background: rgba(255,255,255,0.15);
      border: 2px solid white;
      color: white;
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s;
      min-height: 48px;
    }
    .nav-menu button.active {
      background: white;
      color: var(--primary-color);
    }
    .nav-menu button:hover {
      background: rgba(255,255,255,0.3);
    }
    .nav-spacer { flex: 1; }
    .btn-accent { border-color: var(--secondary-color) !important; color: white !important; }

    .shadow {
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    }
    .py-3 { padding: 2rem 1.5rem; }
    .text-center { text-align: center; }
    
    .patient-booking-wrapper {
      max-width: 800px;
      margin: 0 auto;
    }

    footer p {
      color: #888;
      font-size: 0.9rem;
    }
  `]
})
export class AppComponent {
  auth = inject(AuthService);
  view = signal<'admin-list' | 'admin-create' | 'admin-config' | 'login' | 'register' | 'patient-dashboard' | 'patient-create'>('login');

  constructor() {
    effect(() => {
      const user = this.auth.user();
      if (!user) {
        this.view.set('login');
        return;
      }
      
      // Si acaba de loguearse y está en login/register, redirigir al dashboard según rol
      const currentView = this.view();
      if (currentView === 'login' || currentView === 'register') {
        if (user.role === 'patient') {
          this.view.set('patient-dashboard');
        } else {
          this.view.set('admin-list');
        }
      }
    });
  }

  logout(): void {
    this.auth.logout();
    this.view.set('login');
  }
}
