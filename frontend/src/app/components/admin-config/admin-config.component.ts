import { Component, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DoctorService, Doctor } from '../../services/doctor.service';
import { ConfigService, GlobalConfig } from '../../services/config.service';
import { AppointmentService } from '../../services/appointment.service';
import Swal from 'sweetalert2';
import { ButtonComponent } from '../../shared/atoms/button/button.component';

@Component({
  selector: 'app-admin-config',
  standalone: true,
  imports: [ButtonComponent,CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-config.component.html',
  styleUrls: ['./admin-config.component.css']
})
export class AdminConfigComponent implements OnInit {
  // Señales para estado reactivo del componente
  activeTab = signal<'horarios' | 'estadisticas'>('horarios');
  doctors = signal<Doctor[]>([]);
  selectedDoctor = signal<Doctor | null>(null);
  doctorFormMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);
  configFormMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  // Referencias a dialogs
  @ViewChild('doctorModal') doctorModal!: ElementRef<HTMLDialogElement>;
  @ViewChild('configModal') configModal!: ElementRef<HTMLDialogElement>;
  @ViewChild('exceptionsModal') exceptionsModal!: ElementRef<HTMLDialogElement>;

  // Excepciones del médico seleccionado
  exceptions = signal<any[]>([]);
  exceptionForm: FormGroup;

  // Lista de especialidades predefinidas
  specialties = [
    'Medicina General',
    'Fisioterapia',
    'Quiropraxia',
    'Psicología',
    'Nutrición',
  ];

  // Días de la semana para checklist
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

  toggleDay(day: string): void {
    const idx = this.selectedDays.indexOf(day);
    if (idx >= 0) {
      this.selectedDays.splice(idx, 1);
    } else {
      this.selectedDays.push(day);
    }
    this.doctorForm.patchValue({ activeDays: this.selectedDays.map(Number) });
  }

  closeDoctorModal(): void {
    this.doctorModal.nativeElement.close();
  }

  onDoctorModalClose(): void {
    this.selectedDoctor.set(null);
  }

  openConfigModal(): void {
    this.configFormMessage.set(null);
    this.configModal.nativeElement.showModal();
  }

  closeConfigModal(): void {
    this.configModal.nativeElement.close();
  }

  onConfigModalClose(): void {
  }

  openExceptions(doctor: Doctor): void {
    this.selectedDoctor.set(doctor);
    this.loadExceptions(doctor.id);
    this.exceptionsModal.nativeElement.showModal();
  }

  closeExceptionsModal(): void {
    this.exceptionsModal.nativeElement.close();
  }

  onExceptionsModalClose(): void {
    this.selectedDoctor.set(null);
    this.exceptionForm.reset();
  }

  onDialogClick(event: MouseEvent, dialog: HTMLDialogElement): void {
    if (event.target === dialog) {
      dialog.close();
    }
  }

  isDaySelected(day: string): boolean {
    return this.selectedDays.indexOf(day) >= 0;
  }

  // Formularios reactivos
  doctorForm: FormGroup;
  configForm: FormGroup;

  // Datos de estadísticas
  stats = { total: 0, scheduled: 0, completed: 0, cancelled: 0 };
  doctorStats: any[] = [];
  showDoctorForm = signal<boolean>(false);

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
       activeDays: [[1, 2, 3, 4, 5], Validators.required],
      lunchStart: [null],
      lunchEnd: [null]
    });

    // Inicialización del formulario de configuración global
    this.configForm = this.fb.group({
      minAdvanceHours: [2, [Validators.required, Validators.min(1)]],
      appointmentWindowDays: [15, [Validators.required, Validators.min(1)]]
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
    this.doctorFormMessage.set(null);
    if (doctor) {
      this.selectedDoctor.set(doctor);
      this.doctorForm.patchValue(doctor);
      this.syncDaysFromForm(doctor.activeDays ?? [1, 2, 3, 4, 5]);
    } else {
      this.selectedDoctor.set(null);
      this.doctorForm.reset({
        scheduleStart: '08:00',
        scheduleEnd: '18:00',
        slotDuration: 30,
        activeDays: [1, 2, 3, 4, 5],
        lunchStart: null,
        lunchEnd: null
      });
      this.syncDaysFromForm([1, 2, 3, 4, 5]);
    }
    this.doctorModal.nativeElement.showModal();
  }

  private syncDaysFromForm(days: number[]): void {
    this.selectedDays = days ? days.map(String) : [];
  }

  // Guarda los datos del médico (crea o actualiza)
  saveDoctor(): void {
    const data = this.doctorForm.value;

    // PostgreSQL retorna TIME con segundos (HH:mm:ss), el backend solo acepta HH:mm
    if (data.scheduleStart) data.scheduleStart = data.scheduleStart.substring(0, 5);
    if (data.scheduleEnd) data.scheduleEnd = data.scheduleEnd.substring(0, 5);
    if (data.lunchStart) data.lunchStart = data.lunchStart.substring(0, 5);
    if (data.lunchEnd) data.lunchEnd = data.lunchEnd.substring(0, 5);

    // Validar que la hora fin sea mayor a la hora inicio
    if (data.scheduleStart && data.scheduleEnd && data.scheduleEnd <= data.scheduleStart) {
      this.doctorFormMessage.set({ type: 'error', text: 'La hora de fin debe ser mayor a la hora de inicio.' });
      return;
    }

    // Validar que el fin del descanso sea mayor al inicio del descanso (si ambos están definidos)
    if (data.lunchStart && data.lunchEnd && data.lunchEnd <= data.lunchStart) {
      this.doctorFormMessage.set({ type: 'error', text: 'La hora de fin del descanso debe ser mayor a la hora de inicio.' });
      return;
    }

    // Validar que al menos un día esté seleccionado
    if (this.selectedDays.length === 0) {
      this.doctorFormMessage.set({ type: 'error', text: 'Debes seleccionar al menos un día laboral.' });
      return;
    }

    const doc = this.selectedDoctor();

    if (doc) {
      this.doctorService.updateDoctor(doc.id, data).subscribe({
        next: () => {
          this.loadDoctors();
          this.closeDoctorModal();
        },
        error: (err) => {
          this.doctorFormMessage.set({ type: 'error', text: err.error?.message || 'Error al actualizar el médico.' });
        }
      });
    } else {
      this.doctorService.createDoctor(data).subscribe({
        next: () => {
          this.loadDoctors();
          this.closeDoctorModal();
        },
        error: (err) => {
          this.doctorFormMessage.set({ type: 'error', text: err.error?.message || 'Error al crear el médico.' });
        }
      });
    }
  }

  // Elimina un médico por su ID
  deleteDoctor(id: string): void {
    const doc = this.selectedDoctor();
    this.closeDoctorModal();

    Swal.fire({
      title: 'Eliminar Médico',
      text: doc ? `¿Estás seguro de eliminar a Dr(a). ${doc.name}?` : '¿Estás seguro de eliminar este médico?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    }).then((result) => {
      if (result.isConfirmed) {
        this.doctorService.deleteDoctor(id).subscribe({
          next: () => {
            this.loadDoctors();
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: 'El médico ha sido eliminado correctamente.',
              confirmButtonColor: '#3e7ba6',
            });
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err.error?.message || 'Error al eliminar el médico.',
              confirmButtonColor: '#3e7ba6',
            });
          }
        });
      } else {
        this.openDoctorForm(doc ?? undefined);
      }
    });
  }

  // --- Gestión de Excepciones ---

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
    this.configFormMessage.set(null);
    this.configService.updateConfig(this.configForm.value).subscribe({
      next: () => {
        this.closeConfigModal();
      },
      error: (err) => {
        this.configFormMessage.set({ type: 'error', text: err.error?.message || 'Error al guardar la configuración.' });
      }
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
        confirmButton: 'custom-success-btn',
        container: 'swal-zindex-fix'
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
        confirmButton: 'custom-confirm-btn',
        container: 'swal-zindex-fix'
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
  formatDays(days: number[]): string {
    if (!days || days.length === 0) return '';
    const map: Record<number, string> = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo' };
    return days.map(d => map[d]).filter(Boolean).join(', ');
  }
}


