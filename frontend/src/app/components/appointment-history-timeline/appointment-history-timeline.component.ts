import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentService, AppointmentHistoryEntry } from '../../services/appointment.service';

@Component({
  selector: 'app-appointment-history-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './appointment-history-timeline.component.html',
  styleUrls: ['./appointment-history-timeline.component.css']
})
export class AppointmentHistoryTimelineComponent implements OnInit {
  @Input() appointmentId!: string;
  @Input() showHeader = true;

  history: AppointmentHistoryEntry[] = [];
  loading = false;
  error = '';

  constructor(private appointmentService: AppointmentService) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    if (!this.appointmentId) return;
    this.loading = true;
    this.appointmentService.getAppointmentHistory(this.appointmentId).subscribe({
      next: (data) => {
        this.history = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el historial.';
        this.loading = false;
      }
    });
  }

  getChangeLabel(type: string): string {
    const labels: Record<string, string> = {
      CREATED: 'Creada',
      RESCHEDULED: 'Reagendada',
      CANCELLED: 'Cancelada',
      CONFIRMED: 'Confirmada',
      COMPLETED: 'Completada',
    };
    return labels[type] || type;
  }

  getChangeIcon(type: string): string {
    const icons: Record<string, string> = {
      CREATED: '➕',
      RESCHEDULED: '🔄',
      CANCELLED: '❌',
      CONFIRMED: '✅',
      COMPLETED: '✔️',
    };
    return icons[type] || '📋';
  }

  formatDateTime(dt: string): string {
    try {
      const d = new Date(dt);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${h}:${m}`;
    } catch {
      return dt;
    }
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
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

  formatTime(timeStr: string | null): string {
    if (!timeStr) return '-';
    try {
      const [h, m] = timeStr.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
    } catch {
      return timeStr;
    }
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      doctor: 'Médico',
      staff: 'Agendador',
      patient: 'Paciente',
    };
    return labels[role] || role;
  }
}
