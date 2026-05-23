import { Component, OnInit, signal, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';
import { ButtonComponent } from '../../shared/atoms/button/button.component';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [ButtonComponent, CommonModule],
  templateUrl: './patient-dashboard.component.html',
  styleUrls: ['./patient-dashboard.component.css']
})
export class PatientDashboardComponent implements OnInit {

  @Output() navigate = new EventEmitter<any>();

  appointments = signal<any[]>([]);
  isLoading = signal(true);

  auth = inject(AuthService);
  private appointmentService = inject(AppointmentService);

  ngOnInit(): void {
    this.loadAppointments();
  }

  trackById(index: number, app: any): string {
    return app.id;
  }

  loadAppointments(): void {
    this.isLoading.set(true);

    this.appointmentService.getPatientAppointments().subscribe({
      next: (data) => {
        const sorted = [...data].sort((a, b) => {
          const aActive = a.status === 'agendada' || a.status === 'confirmada' ? 0 : 1;
          const bActive = b.status === 'agendada' || b.status === 'confirmada' ? 0 : 1;
          if (aActive !== bActive) return aActive - bActive;
          return b.appointmentDate?.localeCompare(a.appointmentDate) || 0;
        });
        this.appointments.set(sorted);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

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
          error: (err) => {
            const msg = err.error?.message
              ? (Array.isArray(err.error.message) ? err.error.message[0] : err.error.message)
              : 'Error al cancelar la cita.';
            this.showErrorModal(msg);
          }
        });
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
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  }

  formatTime(timeStr: string): string {
    if (!timeStr) return '';
    try {
      const [h, m] = timeStr.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
    } catch {
      return timeStr;
    }
  }

  goToNuevaCita(): void {
    this.navigate.emit('patient-create');
  }
}
