import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService, AppointmentHistoryEntry } from '../../services/appointment.service';

@Component({
  selector: 'app-admin-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-audit.component.html',
  styleUrls: ['./admin-audit.component.css']
})
export class AdminAuditComponent implements OnInit {
  history: AppointmentHistoryEntry[] = [];
  total = 0;
  loading = false;

  filterChangeType = '';
  filterAppointmentId = '';
  limit = 50;

  changeTypes = ['', 'CREATED', 'RESCHEDULED', 'CANCELLED', 'CONFIRMED', 'COMPLETED'];

  constructor(private appointmentService: AppointmentService) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading = true;
    const params: any = { limit: this.limit };
    if (this.filterChangeType) params.changeType = this.filterChangeType;
    if (this.filterAppointmentId) params.appointmentId = this.filterAppointmentId;

    this.appointmentService.getAllHistory(params).subscribe({
      next: (data) => {
        this.history = data.history;
        this.total = data.total;
        this.loading = false;
      },
      error: () => {
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
