import { Component, OnInit, signal, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-dashboard.component.html',
  styleUrls: ['./patient-dashboard.component.css']
})
export class PatientDashboardComponent implements OnInit {

  // Evento para navegación
  @Output() navigate = new EventEmitter<any>();

  // Lista de citas (signal)
  appointments = signal<any[]>([]);

  // Estado de carga
  isLoading = signal(true);

  // Variables para reagendamiento
  reschedulingId = signal<number | null>(null);
  newDate: string = '';
  newTime: string = '';

  // Horarios disponibles
  availableSlots = signal<string[]>([]);

  // Fecha actual
  today = new Date().toISOString().split('T')[0];

  // Servicios
  auth = inject(AuthService);
  private appointmentService = inject(AppointmentService);

  // Inicialización
  ngOnInit(): void {
    this.loadAppointments();
  }

  // Carga citas del paciente
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

  // Cancelar cita
  cancel(id: number): void {

    // Confirmación del usuario
    if (confirm('¿Está seguro de que desea cancelar esta cita?')) {

      this.appointmentService.cancelAppointment(id).subscribe({
        next: () => this.loadAppointments(), // Recarga lista
        error: (err) => alert(err.error?.message || 'Error al cancelar la cita.')
      });
    }
  }

  // Iniciar reagendamiento
  startReschedule(app: any): void {
    this.reschedulingId.set(app.id);
    this.newDate = app.date;
    this.newTime = '';
    this.onDateChange(app.doctor?.id);
  }

  // Cambio de fecha
  onDateChange(doctorId: number): void {
    if (this.newDate && doctorId) {

      this.appointmentService.getAvailableSlots(doctorId, this.newDate).subscribe({
        next: (slots) => this.availableSlots.set(slots),
        error: () => this.availableSlots.set([])
      });
    }
  }

  // Confirmar reagendamiento
  confirmReschedule(id: number): void {

    this.appointmentService
      .rescheduleAppointment(id, this.newDate, this.newTime)
      .subscribe({
        next: () => {
          this.reschedulingId.set(null);
          this.loadAppointments();
        },
        error: (err) => alert(err.error?.message || 'Error al reagendar.')
      });
  }

  // Devuelve clase CSS según estado
  getStatusClass(status: string): string {
    return `badge-${status.toLowerCase()}`;
  }

  // Obtiene nombre del usuario
  getUserName(): string {
    return this.auth.user()?.firstName || 'Usuario';
  }

  // Formatea fecha (ej: 5 de mar)
  formatDate(dateStr: string): string {
    if (!dateStr) return '';

    try {
      // Evita problemas de zona horaria
      const d = new Date(dateStr + 'T12:00:00');

      const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

      return `${d.getDate()} de ${months[d.getMonth()]}`;

    } catch {
      return dateStr;
    }
  }

  // Navega a crear cita
  goToNuevaCita(): void {
    this.navigate.emit('patient-create');
  }
}