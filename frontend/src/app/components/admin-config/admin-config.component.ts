import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DoctorService, Doctor } from '../../services/doctor.service';
import { ConfigService, GlobalConfig } from '../../services/config.service';
import { AppointmentService } from '../../services/appointment.service';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-admin-config',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-config.component.html',
  styleUrls: ['./admin-config.component.css']
})
export class AdminConfigComponent implements OnInit {
  // Señales para estado reactivo del componente
  activeTab = signal<'horarios' | 'estadisticas'>('horarios');
  doctors = signal<Doctor[]>([]);
  showDoctorForm = signal(false);
  showGlobalConfig = signal(false);
  selectedDoctor = signal<Doctor | null>(null);

  // Excepciones del médico seleccionado
  exceptions = signal<any[]>([]);
  showExceptionForm = signal(false);
  exceptionForm: FormGroup;

  // Lista de especialidades predefinidas
  specialties = [
    'Medicina General',
    'Fisioterapia',
    'Quiropraxia',
    'Psicología',
    'Nutrición',
  ];

  // Formularios reactivos
  doctorForm: FormGroup;
  configForm: FormGroup;

  // Datos de estadísticas
  stats = { total: 0, scheduled: 0, completed: 0, cancelled: 0 };
  doctorStats: any[] = [];

  constructor(
    private fb: FormBuilder,
    private doctorService: DoctorService,
    private configService: ConfigService,
    private appointmentService: AppointmentService
  ) {
    // Inicialización del formulario de médico con validaciones
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

    // Inicialización del formulario de configuración global
    this.configForm = this.fb.group({
      minAdvanceHours: [2, Validators.required],
      appointmentWindowDays: [15, Validators.required]
    });

    // Inicialización del formulario de excepciones
    this.exceptionForm = this.fb.group({
      date: ['', Validators.required],
      reason: ['', Validators.required]
    });
  }

  // Método que se ejecuta al inicializar el componente
  ngOnInit(): void {
    this.loadDoctors();
    this.loadConfig();
    this.loadStats();
  }

  // Carga las estadísticas desde el servicio de citas
  loadStats(): void {
    this.appointmentService.getDashboardStats().subscribe(data => {
      this.stats = data.stats;
      this.doctorStats = data.doctorStats;
    });
  }

  // Carga la lista de médicos desde el servicio
  loadDoctors(): void {
    this.doctorService.getDoctors().subscribe(data => this.doctors.set(data));
  }

  // Carga la configuración global desde el servicio
  loadConfig(): void {
    this.configService.getConfig().subscribe(data => {
      if (data) this.configForm.patchValue(data);
    });
  }

  // Abre el formulario para crear o editar un médico
  openDoctorForm(doctor?: Doctor): void {
    if (doctor) {
      // Si se recibe un médico, se está editando
      this.selectedDoctor.set(doctor);
      this.doctorForm.patchValue(doctor);
    } else {
      // Si no se recibe médico, se está creando uno nuevo
      this.selectedDoctor.set(null);
      // Resetea formulario con valores por defecto
      this.doctorForm.reset({
        scheduleStart: '08:00',
        scheduleEnd: '18:00',
        slotDuration: 30,
        activeDays: '1,2,3,4,5',
        lunchStart: null,
        lunchEnd: null
      });
    }
    this.showDoctorForm.set(true);
  }

  // Guarda los datos del médico (crea o actualiza)
  saveDoctor(): void {
    const data = this.doctorForm.value;

    // PostgreSQL retorna TIME con segundos (HH:mm:ss), el backend solo acepta HH:mm
    if (data.scheduleStart) data.scheduleStart = data.scheduleStart.substring(0, 5);
    if (data.scheduleEnd) data.scheduleEnd = data.scheduleEnd.substring(0, 5);
    if (data.lunchStart) data.lunchStart = data.lunchStart.substring(0, 5);
    if (data.lunchEnd) data.lunchEnd = data.lunchEnd.substring(0, 5);

    const doc = this.selectedDoctor();

    if (doc) {
      // Si existe, actualiza el médico existente
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
      // Si no existe, crea un nuevo médico
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

  // Elimina un médico por su ID
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

  // --- Gestión de Excepciones ---

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

  // Guarda la configuración global
  saveConfig(): void {
    this.configService.updateConfig(this.configForm.value).subscribe(() => {
      this.showGlobalConfig.set(false);
    });
  }

  // ============================================
  // MODALES DE ÉXITO Y ERROR
  // ============================================

  private showSuccessModal(message: string): void {
    Swal.fire({
      icon: 'success',
      title: 'Éxito',
      text: message,
      customClass: {
        popup: 'custom-popup',
        title: 'custom-title',
        confirmButton: 'custom-success-btn'
      },
      confirmButtonText: 'Aceptar',
      showConfirmButton: true,
      timer: undefined,
      timerProgressBar: false
    });
  }

  private showErrorModal(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
      customClass: {
        popup: 'custom-popup',
        title: 'custom-title',
        confirmButton: 'custom-confirm-btn'
      },
      confirmButtonText: 'Entendido'
    });
  }

  // ============================================
  // Métodos auxiliares para la interfaz de usuario
  // ============================================

  // Devuelve un color basado en el ID del médico para el avatar
  getDoctorColor(id: string | number): string {
    const colors = ['#e11d48', '#2563eb', '#7c3aed', '#10b981', '#f59e0b', '#06b6d4'];
    const num = typeof id === 'string' ? id.charCodeAt(id.length - 1) : id;
    return colors[num % colors.length];  // Selecciona color según módulo del ID
  }

  // Formatea los días laborales para mostrar nombres legibles
  formatDays(daysStr: string): string {
    if (!daysStr) return '';
    // Mapeo de números de día a nombres
    const map: any = { '1': 'Lunes', '2': 'Martes', '3': 'Miércoles', '4': 'Jueves', '5': 'Viernes', '6': 'Sábado', '7': 'Domingo' };
    // Convierte cadena separada por comas en array de nombres
    return daysStr.split(',').map(d => map[d.trim()]).filter(d => Boolean(d)).join(', ');
  }
}


