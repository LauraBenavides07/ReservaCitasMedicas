import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService, Appointment } from '../../services/appointment.service';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card filters">
      <div class="field">
        <label for="doctor">Médico / Terapista</label>
        <select id="doctor" [(ngModel)]="selectedDoctorId" (change)="loadAppointments()">
          <option [value]="1">Dr. Gregory House</option>
          <option [value]="2">Dra. Lisa Cuddy</option>
        </select>
      </div>
      <div class="field">
        <label for="date">Fecha de Consulta</label>
        <input id="date" type="date" [(ngModel)]="selectedDate" (change)="loadAppointments()">
      </div>
    </div>

    <div class="card mt-2">
      <h2 class="text-primary">Citas Programadas (Total: {{ total }})</h2>
      
      <div class="table-container">
        <table *ngIf="appointments.length > 0; else noAppointments">
          <thead>
            <tr>
              <th>Hora</th>
              <th>Paciente</th>
              <th>Documento</th>
              <th>Teléfono</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let appt of appointments" class="appointment-row">
              <td><strong>{{ appt.time }}</strong></td>
              <td>{{ appt.patient.firstName }} {{ appt.patient.lastName }}</td>
              <td>{{ appt.patient.document }}</td>
              <td>{{ appt.patient.phone }}</td>
              <td>
                <span class="badge" [ngClass]="appt.status">{{ appt.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <ng-template #noAppointments>
        <div class="empty-msg">
          <p>No hay citas programadas para este médico en la fecha seleccionada.</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      border: 1px solid #e0e0e0;
    }
    .filters {
      display: flex;
      gap: 2rem;
      flex-wrap: wrap;
      margin-bottom: 1.5rem;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
      min-width: 250px;
    }
    label {
      font-weight: 600;
      color: var(--primary-color);
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    select, input {
      padding: 0.8rem;
      border: 2px solid #ddd;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s;
      background-color: var(--neutral-background);
      min-height: 52px; /* Touch target superior a 48px */
    }
    select:focus, input:focus {
      outline: none;
      border-color: var(--primary-color);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }
    th, td {
      padding: 1.2rem 1rem;
      text-align: left;
      border-bottom: 1px solid #f0f0f0;
    }
    th {
      background-color: var(--soft-background);
      color: var(--primary-color);
      font-weight: 700;
    }
    .appointment-row:hover {
      background-color: #f9fbff;
    }
    .badge {
      padding: 0.5rem 1rem;
      border-radius: 50px;
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
    }
    .agendada { background: #e3f2fd; color: #1976d2; }
    .mt-2 { margin-top: 2rem; }
    .text-primary { color: var(--primary-color); }
    .empty-msg {
      text-align: center;
      padding: 3rem;
      color: #777;
      background: var(--neutral-background);
      border-radius: 8px;
    }
    .table-container {
      overflow-x: auto;
    }
  `]
})
export class AppointmentListComponent implements OnInit {
  appointments: Appointment[] = [];
  total: number = 0;
  selectedDoctorId: number = 1;
  selectedDate: string = new Date().toISOString().split('T')[0];

  constructor(private appointmentService: AppointmentService) {}

  ngOnInit() {
    this.loadAppointments();
  }

  loadAppointments() {
    this.appointmentService.getAppointments(this.selectedDoctorId, this.selectedDate)
      .subscribe({
        next: (res) => {
          this.appointments = res.appointments;
          this.total = res.total;
        },
        error: (err) => {
          console.error('Error loading appointments', err);
        }
      });
  }
}
