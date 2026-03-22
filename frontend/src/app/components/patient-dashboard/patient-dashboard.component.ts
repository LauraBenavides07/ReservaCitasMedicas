import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <h2 class="text-primary">Mi Panel de Citas</h2>
        <p>Bienvenido, <strong>{{ auth.user()?.firstName }}</strong></p>
      </header>

      <div class="appointments-section">
        <h3>Sus Citas Programadas</h3>
        
        <div *ngIf="isLoading()" class="loading">Cargando citas...</div>
        
        <div *ngIf="!isLoading() && appointments().length === 0" class="empty-state">
          No tiene citas agendadas actualmente.
        </div>

        <div class="appointments-list" *ngIf="appointments().length > 0">
          <div *ngFor="let app of appointments()" class="appointment-card" [class.rescheduling]="reschedulingId() === app.id" [class.cancelled]="app.status === 'cancelada'">
            <div class="app-info" *ngIf="reschedulingId() !== app.id">
              <span class="date">{{ app.date }}</span>
              <span class="time">{{ app.time }}</span>
              <span class="doctor">Dr/a. {{ app.doctor?.name }}</span>
              <span class="status-badge" [class]="app.status">{{ app.status | titlecase }}</span>
            </div>

            <!-- UI de Reagendar -->
            <div class="reschedule-form" *ngIf="reschedulingId() === app.id">
              <h4>Reagendar con Dr/a. {{ app.doctor?.name }}</h4>
              <div class="form-fields">
                <div class="field">
                  <label>Nueva Fecha:</label>
                  <input type="date" [(ngModel)]="newDate" (change)="onDateChange(app.doctor.id)" [min]="today">
                </div>
                <div class="field">
                  <label>Nueva Hora:</label>
                  <select [(ngModel)]="newTime">
                    <option value="">Seleccione...</option>
                    <option *ngFor="let slot of availableSlots()" [value]="slot">{{ slot }}</option>
                  </select>
                </div>
              </div>
              <div class="reschedule-actions">
                <button (click)="confirmReschedule(app.id)" class="btn-confirm" [disabled]="!newDate || !newTime">Confirmar</button>
                <button (click)="reschedulingId.set(null)" class="btn-cancel">Cancelar</button>
              </div>
            </div>
            
            <div class="actions" *ngIf="app.status === 'agendada' && reschedulingId() !== app.id">
              <button (click)="startReschedule(app)" class="btn-reschedule">Reagendar</button>
              <button (click)="cancel(app.id)" class="btn-cancel-red">Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .dashboard-container { background: var(--bg-soft); padding: 2rem; border-radius: 12px; margin-bottom: 2rem; }
    .dashboard-header { margin-bottom: 2rem; }
    h3 { color: var(--primary-color); border-bottom: 2px solid var(--secondary-color); padding-bottom: 0.5rem; }

    .appointments-list { display: grid; gap: 1rem; margin-top: 1rem; }
    .appointment-card {
      background: white; padding: 1.5rem; border-radius: 8px;
      display: flex; justify-content: space-between; align-items: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05); border-left: 6px solid var(--primary-color);
    }
    .appointment-card.rescheduling { flex-direction: column; align-items: stretch; border-left-color: var(--secondary-color); }
    .appointment-card.cancelled { border-left-color: #ccc; opacity: 0.7; }

    .app-info { display: flex; flex-direction: column; gap: 0.3rem; }
    .date { font-weight: bold; font-size: 1.2rem; }
    .time { color: var(--primary-color); font-weight: 600; }
    .doctor { font-size: 1.1rem; }

    .status-badge { padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.9rem; font-weight: bold; width: fit-content; }
    .status-badge.agendada { background: #e8f5e9; color: #2e7d32; }
    .status-badge.cancelada { background: #ffebee; color: #c62828; }

    .actions { display: flex; gap: 0.5rem; }
    .btn-reschedule { background: var(--secondary-color); color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: bold; cursor: pointer; min-height: 48px; }
    .btn-cancel-red { background: white; color: #c62828; border: 2px solid #c62828; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: bold; cursor: pointer; min-height: 48px; }

    .reschedule-form h4 { margin: 0 0 1rem 0; color: var(--primary-color); }
    .form-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
    .field { display: flex; flex-direction: column; gap: 0.3rem; }
    .field label { font-size: 0.9rem; font-weight: bold; }
    .field input, .field select { padding: 0.6rem; border: 2px solid var(--secondary-color); border-radius: 8px; font-size: 1rem; min-height: 48px; }
    
    .reschedule-actions { display: flex; justify-content: flex-end; gap: 1rem; }
    .btn-confirm { background: var(--primary-color); color: white; border: none; padding: 0.6rem 1.5rem; border-radius: 8px; font-weight: bold; cursor: pointer; min-height: 48px; }
    .btn-cancel { background: #eee; border: none; padding: 0.6rem 1.5rem; border-radius: 8px; font-weight: bold; cursor: pointer; min-height: 48px; }

    .loading, .empty-state { text-align: center; padding: 3rem; font-size: 1.2rem; color: #666; }
  `
})
export class PatientDashboardComponent implements OnInit {
  appointments = signal<any[]>([]);
  isLoading = signal(true);
  
  reschedulingId = signal<number | null>(null);
  newDate: string = '';
  newTime: string = '';
  availableSlots = signal<string[]>([]);
  today = new Date().toISOString().split('T')[0];

  auth = inject(AuthService);
  private appointmentService = inject(AppointmentService);

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.isLoading.set(true);
    this.appointmentService.getPatientAppointments().subscribe({
      next: (data) => {
        this.appointments.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  cancel(id: number): void {
    if (confirm('¿Está seguro de que desea cancelar esta cita?')) {
      this.appointmentService.cancelAppointment(id).subscribe({
        next: () => this.loadAppointments(),
        error: (err) => alert(err.error?.message || 'Error al cancelar la cita.')
      });
    }
  }

  startReschedule(app: any): void {
    this.reschedulingId.set(app.id);
    this.newDate = app.date;
    this.newTime = '';
    this.onDateChange(app.doctor.id);
  }

  onDateChange(doctorId: number): void {
    if (this.newDate) {
      this.appointmentService.getAvailableSlots(doctorId, this.newDate).subscribe({
        next: (slots) => this.availableSlots.set(slots),
        error: () => this.availableSlots.set([])
      });
    }
  }

  confirmReschedule(id: number): void {
    this.appointmentService.rescheduleAppointment(id, this.newDate, this.newTime).subscribe({
      next: () => {
        this.reschedulingId.set(null);
        this.loadAppointments();
      },
      error: (err) => alert(err.error?.message || 'Error al reagendar.')
    });
  }
}
