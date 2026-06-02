import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService, AppointmentHistoryEntry } from '../../services/appointment.service';
import { DoctorService, Doctor } from '../../services/doctor.service';
import { ButtonComponent } from '../../shared/atoms/button/button.component';
import Swal from 'sweetalert2';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-admin-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './admin-audit.component.html',
  styleUrls: ['./admin-audit.component.css']
})
export class AdminAuditComponent implements OnInit {
  history: AppointmentHistoryEntry[] = [];
  total = 0;
  loading = false;
  error = '';

  filterChangeType = '';
  filterDoctorId = '';
  filterDate = '';
  filterSearch = '';
  limit = 50;

  doctors: Doctor[] = [];

  changeTypes = [
    { value: '',            label: 'Todos los cambios' },
    { value: 'CREATED',     label: 'Creada',     icon: 'ri-add-circle-line' },
    { value: 'RESCHEDULED', label: 'Reagendada', icon: 'ri-calendar-line' },
    { value: 'CANCELLED',   label: 'Cancelada',  icon: 'ri-close-circle-line' },
    { value: 'CONFIRMED',   label: 'Confirmada', icon: 'ri-checkbox-circle-line' },
    { value: 'COMPLETED',   label: 'Completada', icon: 'ri-check-double-line' }
  ];

  getChangeTypeIcon(value: string): string {
    return this.changeTypes.find(t => t.value === value)?.icon || '';
  }

  getChangeTypeLabel(value: string): string {
    return this.changeTypes.find(t => t.value === value)?.label || '';
  }

  constructor(
    private appointmentService: AppointmentService,
    private doctorService: DoctorService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDoctors();
    this.loadHistory();
  }

  loadDoctors(): void {
    this.doctorService.getDoctors().subscribe({
      next: (list) => {
        this.doctors = list;
        this.cdr.detectChanges();
      },
      error: () => {
        this.doctors = [];
      }
    });
  }

  loadHistory(): void {
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    const params: any = { limit: this.limit };
    if (this.filterChangeType) {
      params.changeType = this.filterChangeType;
    }
    if (this.filterDoctorId) {
      params.doctorId = this.filterDoctorId;
    }
    if (this.filterDate) {
      params.date = this.filterDate;
    }
    if (this.filterSearch && this.filterSearch.trim()) {
      params.search = this.filterSearch.trim();
    }

    this.appointmentService.getAllHistory(params)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (response) => {
          if (response && response.history) {
            this.history = response.history;
            this.total = response.total || response.history.length;
          } else if (response && Array.isArray(response)) {
            this.history = response;
            this.total = response.length;
          } else {
            this.history = [];
            this.total = 0;
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = err.error?.message || err.message || 'Error al cargar el historial';
          this.history = [];
          this.total = 0;
          this.cdr.detectChanges();
          this.showErrorToast(this.error);
        }
      });
  }

  applyFilter(): void {
    this.loadHistory();
  }

  clearFilters(): void {
    this.filterChangeType = '';
    this.filterDoctorId = '';
    this.filterDate = '';
    this.filterSearch = '';
    this.loadHistory();
  }

  trackById(index: number, entry: AppointmentHistoryEntry): string {
    return entry.id;
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




// Método para mostrar el responsable con ID y nombre
getResponsibleDisplay(changedBy: string, role: string): string {
    if (!changedBy) return '-';
    
    // Si es un email, mostrar solo la parte antes del @
    let displayName = changedBy;
    if (changedBy.includes('@')) {
        displayName = changedBy.split('@')[0];
    }
    
    const roleLabel = this.getRoleLabel(role);
  
    return `${displayName} (${roleLabel})`;
}

  formatDateTime(dt: string): string {
    if (!dt) return '-';
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
      system: 'Sistema'
    };
    return labels[role] || role;
  }
  // Obtener el ID del responsable
  getResponsibleId(entry: any): string {
    const role = entry.changedByRole;
    const changedBy = entry.changedBy;
    
    // Para admin y staff con UUID, mostrar "Administrador" o "Staff"
    if ((role === 'admin' || role === 'staff') && changedBy && changedBy.includes('-')) {
        return role === 'admin' ? 'Administrador' : 'Staff';
    }
    
    // Para admin/staff con email
    if (role === 'admin' || role === 'staff') {
        if (changedBy && changedBy.includes('@')) {
            return changedBy;
        }
        return role === 'admin' ? 'Administrador' : 'Staff';
    }
    
    // Para paciente
    if (role === 'patient' && entry.patientDocument) {
        return entry.patientDocument;
    }
    
    // Para doctor
    if (role === 'doctor' && entry.doctorDocument) {
        return entry.doctorDocument;
    }
    
    return changedBy || '-';
  }

// Obtener el nombre del responsable
getResponsibleName(entry: any): string {
    // Si es paciente, usar el nombre del paciente de la cita
    if (entry.changedByRole === 'patient') {
        return entry.patientName || 'Paciente';
    }
    
    // Si es médico/doctor
    if (entry.changedByRole === 'doctor') {
        return entry.doctorName || 'Médico';
    }
    
    // Para admin/staff, intentar extraer nombre del email
    if (entry.changedBy && entry.changedBy.includes('@')) {
        return entry.changedBy.split('@')[0];
    }
    
    return entry.changedBy || '-';
}



  exportToCSV(): void {
    if (this.history.length === 0) {
      this.showErrorToast('No hay datos para exportar');
      return;
    }

    const headers = ['Fecha/Hora', 'Paciente', 'Médico', 'Tipo', 'Valor Anterior', 'Valor Nuevo', 'Responsable', 'Rol'];
    const rows = this.history.map(entry => [
      this.formatDateTime(entry.changedAt),
      entry.patientName || '-',
      entry.doctorName || '-',
      this.getChangeLabel(entry.changeType),
      entry.changeType === 'RESCHEDULED' 
        ? `${this.formatDate(entry.previousDate)} ${this.formatTime(entry.previousTime)}`
        : (entry.previousStatus || '-'),
      entry.changeType === 'RESCHEDULED'
        ? `${this.formatDate(entry.newDate)} ${this.formatTime(entry.newTime)}`
        : (entry.newStatus || '-'),
      entry.changedBy,
      this.getRoleLabel(entry.changedByRole)
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_citas_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    this.showSuccessToast('Archivo CSV exportado correctamente');
  }

  private showErrorToast(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000
    });
  }

  private showSuccessToast(message: string): void {
    Swal.fire({
      icon: 'success',
      title: 'Éxito',
      text: message,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000
    });
  }
}
