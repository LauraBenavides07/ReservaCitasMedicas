import { Component, OnInit, signal, AfterViewInit, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DoctorService, Doctor } from '../../services/doctor.service';
import { ConfigService, GlobalConfig } from '../../services/config.service';
import { AppointmentService, DashboardStats, DashboardStatsFilter } from '../../services/appointment.service';
import Swal from 'sweetalert2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-admin-config',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-config.component.html',
  styleUrls: ['./admin-config.component.css']
})
export class AdminConfigComponent implements OnInit, AfterViewInit {
  activeTab = signal<'horarios' | 'estadisticas'>('horarios');
  doctors = signal<Doctor[]>([]);
  showDoctorForm = signal(false);
  showGlobalConfig = signal(false);
  selectedDoctor = signal<Doctor | null>(null);

  exceptions = signal<any[]>([]);
  showExceptionForm = signal(false);
  exceptionForm: FormGroup;

  specialties = [
    'Medicina General',
    'Fisioterapia',
    'Quiropraxia',
    'Psicología',
    'Nutrición',
  ];

  dayList = [
    { value: '1', label: 'Lun' },
    { value: '2', label: 'Mar' },
    { value: '3', label: 'Mié' },
    { value: '4', label: 'Jue' },
    { value: '5', label: 'Vie' },
    { value: '6', label: 'Sáb' },
    { value: '7', label: 'Dom' },
  ];
  selectedDays: string[] = ['1', '2', '3', '4', '5'];

  doctorForm: FormGroup;
  configForm: FormGroup;

  // Stats state
  stats: DashboardStats | null = null;
  loadingStats = false;
  statsError = '';

  // Filters
  filterDoctorId = '';
  filterStartDate = '';
  filterEndDate = '';
  filterStatus = '';

  // Quick date ranges
  quickRange = 'this-month';

  // Chart refs
  @ViewChild('trendChart') trendChartRef!: ElementRef;
  @ViewChild('statusChart') statusChartRef!: ElementRef;
  @ViewChild('doctorChart') doctorChartRef!: ElementRef;
  private trendChart: Chart | null = null;
  private statusChart: Chart | null = null;
  private doctorChart: Chart | null = null;

  get cancellationRate(): number {
    if (!this.stats || this.stats.stats.total === 0) return 0;
    return this.stats.stats.cancellationRate;
  }

  get hasHighCancellation(): boolean {
    return this.cancellationRate > 20;
  }

  get hasNoAppointments(): boolean {
    return this.stats !== null && this.stats.stats.total === 0;
  }

  constructor(
    private fb: FormBuilder,
    private doctorService: DoctorService,
    private configService: ConfigService,
    private appointmentService: AppointmentService
  ) {
    this.doctorForm = this.fb.group({
      name: ['', Validators.required],
      specialty: ['', Validators.required],
      scheduleStart: ['08:00', Validators.required],
      scheduleEnd: ['18:00', Validators.required],
      slotDuration: [30, [Validators.required, Validators.min(10)]],
      activeDays: ['1,2,3,4,5', Validators.required],
      lunchStart: [null],
      lunchEnd: [null]
    });

    this.configForm = this.fb.group({
      minAdvanceHours: [2, [Validators.required, Validators.min(1)]],
      appointmentWindowDays: [15, [Validators.required, Validators.min(1)]]
    });

    this.exceptionForm = this.fb.group({
      date: ['', Validators.required],
      reason: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadDoctors();
    this.loadConfig();
    this.loadStats();
  }

  ngAfterViewInit(): void {
    // Charts are created after stats load
  }

  toggleDay(day: string): void {
    const idx = this.selectedDays.indexOf(day);
    if (idx >= 0) {
      this.selectedDays.splice(idx, 1);
    } else {
      this.selectedDays.push(day);
    }
    this.doctorForm.patchValue({ activeDays: this.selectedDays.join(',') });
  }

  isDaySelected(day: string): boolean {
    return this.selectedDays.indexOf(day) >= 0;
  }

  // ============================================
  // STATS
  // ============================================

  loadStats(): void {
    this.stats = null;
    this.loadingStats = true;
    this.statsError = '';
    this.destroyCharts();

    const filter: DashboardStatsFilter = {};
    if (this.filterDoctorId) filter.doctorId = this.filterDoctorId;
    if (this.filterStatus) filter.status = this.filterStatus;

    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (this.quickRange) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'this-week': {
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
        break;
      }
      case 'this-month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last-month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      case 'last-90':
        start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'custom':
        start = this.filterStartDate ? new Date(this.filterStartDate) : new Date(now.getFullYear(), now.getMonth(), 1);
        end = this.filterEndDate ? new Date(this.filterEndDate) : new Date();
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    if (this.quickRange !== 'custom' || this.filterStartDate) {
      filter.startDate = start.toISOString().split('T')[0];
    }
    if (this.quickRange !== 'custom' || this.filterEndDate) {
      filter.endDate = end.toISOString().split('T')[0];
    }

    this.appointmentService.getDashboardStats(filter).subscribe({
      next: (data) => {
        this.stats = data;
        this.loadingStats = false;
        setTimeout(() => this.createCharts(), 50);
      },
      error: (err) => {
        console.error('Error loading stats:', err);
        this.statsError = 'Error al cargar estadísticas.';
        this.loadingStats = false;
      }
    });
  }

  applyFilter(): void {
    this.loadStats();
  }

  setQuickRange(range: string): void {
    this.quickRange = range;
    this.loadStats();
  }

  exportStatsCSV(): void {
    if (!this.stats) return;
    const rows: string[] = [];
    rows.push('Métrica,Valor');
    rows.push(`Total Citas,${this.stats.stats.total}`);
    rows.push(`Agendadas,${this.stats.stats.scheduled}`);
    rows.push(`Confirmadas,${this.stats.stats.confirmed}`);
    rows.push(`Completadas,${this.stats.stats.completed}`);
    rows.push(`Canceladas,${this.stats.stats.cancelled}`);
    rows.push(`Tasa Cancelación,${this.stats.stats.cancellationRate}%`);
    rows.push('');
    rows.push('Médico,Citas,Proporción');
    this.stats.doctorStats.forEach(d => {
      rows.push(`${d.name},${d.count},${d.percentage}%`);
    });
    rows.push('');
    rows.push('Fecha,Citas');
    this.stats.dailyTrend.forEach(d => {
      rows.push(`${d.date},${d.count}`);
    });
    rows.push('');
    rows.push('Estado,Citas');
    this.stats.statusDistribution.forEach(s => {
      rows.push(`${s.status},${s.count}`);
    });

    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `estadisticas-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  private createCharts(): void {
    if (!this.stats) return;
    this.destroyCharts();
    this.createTrendChart();
    this.createStatusChart();
    this.createDoctorChart();
  }

  private destroyCharts(): void {
    if (this.trendChart) { this.trendChart.destroy(); this.trendChart = null; }
    if (this.statusChart) { this.statusChart.destroy(); this.statusChart = null; }
    if (this.doctorChart) { this.doctorChart.destroy(); this.doctorChart = null; }
  }

  private createTrendChart(): void {
    if (!this.trendChartRef?.nativeElement || !this.stats?.dailyTrend.length) return;
    const data = this.stats.dailyTrend;
    this.trendChart = new Chart(this.trendChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: data.map(d => {
          const parts = d.date.split('-');
          return `${parts[2]}/${parts[1]}`;
        }),
        datasets: [{
          label: 'Citas',
          data: data.map(d => d.count),
          borderColor: '#3E7BA6',
          backgroundColor: 'rgba(62, 123, 166, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } },
          x: { ticks: { maxRotation: 45, font: { size: 10 } } }
        }
      }
    });
  }

  private createStatusChart(): void {
    if (!this.statusChartRef?.nativeElement || !this.stats?.statusDistribution.length) return;
    const statusLabels: Record<string, string> = {
      'agendada': 'Agendadas',
      'confirmada': 'Confirmadas',
      'completada': 'Completadas',
      'cancelada': 'Canceladas'
    };
    const statusColors: Record<string, string> = {
      'agendada': '#3E7BA6',
      'confirmada': '#10b981',
      'completada': '#8b5cf6',
      'cancelada': '#ef4444'
    };
    const data = this.stats.statusDistribution;
    this.statusChart = new Chart(this.statusChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: data.map(d => statusLabels[d.status] || d.status),
        datasets: [{
          data: data.map(d => d.count),
          backgroundColor: data.map(d => statusColors[d.status] || '#94a3b8'),
          borderWidth: 2,
          borderColor: '#fff',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } }
        }
      }
    });
  }

  private createDoctorChart(): void {
    if (!this.doctorChartRef?.nativeElement || !this.stats?.doctorStats.length) return;
    const data = this.stats.doctorStats.slice(0, 8);
    const colors = ['#3E7BA6', '#7FA5C9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
    this.doctorChart = new Chart(this.doctorChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: data.map(d => d.name.replace('Dr(a). ', '')),
        datasets: [{
          label: 'Citas',
          data: data.map(d => d.count),
          backgroundColor: colors.slice(0, data.length),
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { stepSize: 1 } },
          y: { ticks: { font: { size: 10 } } }
        }
      }
    });
  }

  // ============================================
  // DOCTOR CRUD
  // ============================================

  loadDoctors(): void {
    this.doctorService.getDoctors().subscribe(data => this.doctors.set(data));
  }

  loadConfig(): void {
    this.configService.getConfig().subscribe(data => {
      if (data) this.configForm.patchValue(data);
    });
  }

  openDoctorForm(doctor?: Doctor): void {
    if (doctor) {
      this.selectedDoctor.set(doctor);
      this.doctorForm.patchValue(doctor);
      this.syncDaysFromForm(doctor.activeDays || '1,2,3,4,5');
    } else {
      this.selectedDoctor.set(null);
      this.doctorForm.reset({
        scheduleStart: '08:00',
        scheduleEnd: '18:00',
        slotDuration: 30,
        activeDays: '1,2,3,4,5',
        lunchStart: null,
        lunchEnd: null
      });
      this.syncDaysFromForm('1,2,3,4,5');
    }
    this.showDoctorForm.set(true);
  }

  private syncDaysFromForm(daysStr: string): void {
    this.selectedDays = daysStr ? daysStr.split(',').filter(d => d.trim()) : [];
  }

  saveDoctor(): void {
    const data = this.doctorForm.value;

    if (data.scheduleStart) data.scheduleStart = data.scheduleStart.substring(0, 5);
    if (data.scheduleEnd) data.scheduleEnd = data.scheduleEnd.substring(0, 5);
    if (data.lunchStart) data.lunchStart = data.lunchStart.substring(0, 5);
    if (data.lunchEnd) data.lunchEnd = data.lunchEnd.substring(0, 5);

    if (data.scheduleStart && data.scheduleEnd && data.scheduleEnd <= data.scheduleStart) {
      this.showErrorModal('La hora de fin debe ser mayor a la hora de inicio.');
      return;
    }

    if (data.lunchStart && data.lunchEnd && data.lunchEnd <= data.lunchStart) {
      this.showErrorModal('La hora de fin del descanso debe ser mayor a la hora de inicio.');
      return;
    }

    if (this.selectedDays.length === 0) {
      this.showErrorModal('Debes seleccionar al menos un día laboral.');
      return;
    }

    const doc = this.selectedDoctor();

    if (doc) {
      this.doctorService.updateDoctor(doc.id, data).subscribe({
        next: () => {
          this.loadDoctors();
          this.showDoctorForm.set(false);
        },
        error: (err) => {
          this.showErrorModal(err.error?.message || 'Error al actualizar el médico.');
        }
      });
    } else {
      this.doctorService.createDoctor(data).subscribe({
        next: () => {
          this.loadDoctors();
          this.showDoctorForm.set(false);
        },
        error: (err) => {
          this.showErrorModal(err.error?.message || 'Error al crear el médico.');
        }
      });
    }
  }

  deleteDoctor(id: string): void {
    if (confirm('¿Está seguro de eliminar este médico?')) {
      this.doctorService.deleteDoctor(id).subscribe({
        next: () => this.loadDoctors(),
        error: (err) => {
          alert(err.error?.message || 'Error al eliminar el médico.');
        }
      });
    }
  }

  // --- Excepciones ---

  openExceptions(doctor: Doctor): void {
    this.selectedDoctor.set(doctor);
    this.loadExceptions(doctor.id);
    this.showExceptionForm.set(true);
  }

  loadExceptions(doctorId: string): void {
    this.doctorService.getExceptions(doctorId).subscribe(data => {
      this.exceptions.set(data);
    });
  }

  addException(): void {
    const doc = this.selectedDoctor();
    if (!doc || this.exceptionForm.invalid) return;

    this.doctorService.addException(doc.id, this.exceptionForm.value).subscribe(() => {
      this.loadExceptions(doc.id);
      this.exceptionForm.reset();
    });
  }

  removeException(id: string): void {
    const doc = this.selectedDoctor();
    if (!doc) return;

    this.doctorService.removeException(doc.id, id).subscribe(() => {
      this.loadExceptions(doc.id);
    });
  }

  saveConfig(): void {
    this.configService.updateConfig(this.configForm.value).subscribe(() => {
      this.showGlobalConfig.set(false);
    });
  }

  // ============================================
  // MODALS
  // ============================================

  private showSuccessModal(message: string): void {
    Swal.fire({
      icon: 'success',
      title: 'Éxito',
      text: message,
      customClass: {
        container: 'swal-zindex-fix',
        popup: 'custom-popup',
        title: 'custom-title',
        confirmButton: 'custom-success-btn',
      },
      confirmButtonText: 'Aceptar'
    });
  }

  private showErrorModal(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
      customClass: {
        container: 'swal-zindex-fix',
        popup: 'custom-popup',
        title: 'custom-title',
        confirmButton: 'custom-confirm-btn',
      },
      confirmButtonText: 'Entendido'
    });
  }

  // ============================================
  // UTILS
  // ============================================

  getDoctorColor(id: string | number): string {
    const colors = ['#e11d48', '#2563eb', '#7c3aed', '#10b981', '#f59e0b', '#06b6d4'];
    const num = typeof id === 'string' ? id.charCodeAt(id.length - 1) : id;
    return colors[num % colors.length];
  }

  formatDays(daysStr: string): string {
    if (!daysStr) return '';
    const map: any = { '1': 'Lunes', '2': 'Martes', '3': 'Miércoles', '4': 'Jueves', '5': 'Viernes', '6': 'Sábado', '7': 'Domingo' };
    return daysStr.split(',').map(d => map[d.trim()]).filter(d => Boolean(d)).join(', ');
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T12:00:00');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
