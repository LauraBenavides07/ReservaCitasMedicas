import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService, AppointmentHistoryEntry } from '../../services/appointment.service';
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
  filterAppointmentId = '';
  limit = 50;

  changeTypes = [
    { value: '', label: '📋 Todos los cambios' },
    { value: 'CREATED', label: '➕ Creada' },
    { value: 'RESCHEDULED', label: '🔄 Reagendada' },
    { value: 'CANCELLED', label: '❌ Cancelada' },
    { value: 'CONFIRMED', label: '✅ Confirmada' },
    { value: 'COMPLETED', label: '✔️ Completada' }
  ];

  constructor(
    private appointmentService: AppointmentService,
    private cdr: ChangeDetectorRef  // ← Agregar ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    console.log('🔍 Cargando historial...');
    
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges(); // ← Forzar detección de cambios para mostrar el spinner
    
    const params: any = { limit: this.limit };
    if (this.filterChangeType && this.filterChangeType !== '') {
      params.changeType = this.filterChangeType;
    }
    if (this.filterAppointmentId && this.filterAppointmentId.trim() !== '') {
      params.appointmentId = this.filterAppointmentId.trim();
    }

    this.appointmentService.getAllHistory(params)
      .pipe(finalize(() => {
        console.log('🔍 finalize() ejecutado');
        this.loading = false;
        this.cdr.detectChanges(); // ← Forzar detección de cambios para ocultar el spinner
      }))
      .subscribe({
        next: (response) => {
          console.log('✅ Respuesta recibida:', response);
          
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
          
          console.log(`📊 Total registros: ${this.total}`);
          this.cdr.detectChanges(); // ← Forzar actualización de la tabla
        },
        error: (err) => {
          console.error('❌ Error:', err);
          this.error = err.error?.message || err.message || 'Error al cargar el historial';
          this.history = [];
          this.total = 0;
          this.cdr.detectChanges(); // ← Forzar actualización del error
          this.showErrorToast(this.error);
        }
      });
  }

  applyFilter(): void {
    this.loadHistory();
  }

  showHelpId(): void {
    Swal.fire({
      title: '¿Cómo obtener el ID de una cita?',
      html: `
        <div style="text-align: left;">
          <p><strong>📋 El ID de cita (UUID) se genera automáticamente</strong></p>
          <p>Puedes obtenerlo en la <strong>respuesta del backend</strong> cuando creas una cita.</p>
          <p><strong>🔍 Ejemplo de formato UUID:</strong></p>
          <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">
            3089f3ac-aa36-4d00-8eb5-fcf938c93b2b
          </code>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Entendido'
    });
  }

  trackById(index: number, entry: AppointmentHistoryEntry): string {
    return entry.id;
  }

  getChangeLabel(type: string): string {
    const labels: Record<string, string> = {
      CREATED: '➕ Creada',
      RESCHEDULED: '🔄 Reagendada',
      CANCELLED: '❌ Cancelada',
      CONFIRMED: '✅ Confirmada',
      COMPLETED: '✔️ Completada',
    };
    return labels[type] || type;
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

  getResponsibleDisplay(changedBy: string, role: string): string {
    if (!changedBy) return '-';
    if (role === 'patient' && changedBy.includes('@')) {
      const local = changedBy.split('@')[0];
      return `Paciente: ${local}`;
    }
    if (changedBy.includes('@')) {
      return changedBy.split('@')[0];
    }
    return changedBy;
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
