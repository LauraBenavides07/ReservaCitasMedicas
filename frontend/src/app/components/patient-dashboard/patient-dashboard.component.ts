import { Component, OnInit, signal, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

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
  reschedulingId = signal<string | null>(null);
  newDate: string = '';
  newTime: string = '';

  // Horarios disponibles
  availableSlots = signal<string[]>([]);

  // Fecha actual (Local para evitar desfase UTC en horas nocturnas)
  today = new Date().toLocaleDateString('en-CA'); // 'en-CA' produce el formato YYYY-MM-DD local

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

  // ============================================
  // CANCELAR CITA
  // ============================================
  cancel(id: string): void {
    Swal.fire({
      title: 'Cancelar cita',
      text: '¿Está seguro de que desea cancelar esta cita?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No, mantener',
      customClass: {
        popup: 'custom-popup',
        title: 'custom-title',
        confirmButton: 'custom-danger-btn',
        cancelButton: 'custom-cancel-btn'
        
      }
    }).then((result: any) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Cancelando cita...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
          customClass: {
            popup: 'custom-popup',
            title: 'custom-title'
          }
        });
        
        this.appointmentService.cancelAppointment(id).subscribe({
          next: () => {
            this.loadAppointments();
            Swal.fire({
              icon: 'success',
              title: 'Cita cancelada',
              text: 'La cita ha sido cancelada exitosamente.',
              confirmButtonText: 'Aceptar',
              confirmButtonColor: '#3154ab',
              timer: 2000,
              timerProgressBar: true,
              customClass: {
                popup: 'custom-popup',
                title: 'custom-title',
                confirmButton: 'custom-success-btn'
              }
            });
          },
          error: () => {
            this.showErrorModal('Error al cancelar la cita.');
          }
        });
      }
    });
  }

  // ============================================
  // REAGENDAR CITA
  // ============================================
  startReschedule(app: any): void {
    this.reschedulingId.set(app.id);
    this.newDate = app.appointmentDate;
    this.newTime = '';
    this.onDateChange(app.doctor?.id);
  }

  onDateChange(doctorId: string): void {
    if (this.newDate && doctorId) {
      this.appointmentService.getAvailableSlots(doctorId, this.newDate).subscribe({
        next: (slots: string[]) => this.availableSlots.set(slots),
        error: () => this.availableSlots.set([])
      });
    }
  }

  confirmReschedule(id: string): void {
    if (!this.newDate || !this.newTime) {
      this.showErrorModal('Por favor selecciona una nueva fecha y hora.');
      return;
    }

    Swal.fire({
      title: 'Reagendar cita',
      text: `¿Confirmar reagendamiento para el ${this.newDate} a las ${this.newTime}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1e3a6a',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, reagendar',
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'custom-popup',
        title: 'custom-title',
        confirmButton: 'custom-confirm-btn',
        cancelButton: 'custom-cancel-btn'
      }
    }).then((result: any) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Reagendando cita...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
          customClass: {
            popup: 'custom-popup',
            title: 'custom-title'
          }
        });
        
        this.appointmentService.rescheduleAppointment(id, this.newDate, this.newTime).subscribe({
          next: () => {
            this.reschedulingId.set(null);
            this.loadAppointments();
            Swal.fire({
              icon: 'success',
              title: 'Cita reagendada',
              text: 'La cita ha sido reagendada exitosamente.',
              confirmButtonText: 'Aceptar',
              confirmButtonColor: '#3154ab',
              timer: 2000,
              timerProgressBar: true,
              customClass: {
                popup: 'custom-popup',
                title: 'custom-title',
                confirmButton: 'custom-success-btn'
              }
            });
          },
          error: () => {
            this.reschedulingId.set(null);
            this.showErrorModal('Error al reagendar la cita.');
          }
        });
      } else {
        this.reschedulingId.set(null);
      }
    });
  }

  private showErrorModal(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#1e3a6a',
      customClass: {
        popup: 'custom-popup',
        title: 'custom-title',
        confirmButton: 'custom-confirm-btn'
      }
    });
  }

  getStatusClass(status: string): string {
    return `badge-${status.toLowerCase()}`;
  }

  getUserName(): string {
    return this.auth.user()?.firstName || 'Usuario';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T12:00:00');
      const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      return `${d.getDate()} de ${months[d.getMonth()]}`;
    } catch {
      return dateStr;
    }
  }

  goToNuevaCita(): void {
    this.navigate.emit('patient-create');
  }
}