import { Component, OnInit, signal, ViewChild, ElementRef, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DoctorService, Doctor } from '../../services/doctor.service';
import { ConfigService, GlobalConfig } from '../../services/config.service';
import { AppointmentService } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';
import { ButtonComponent } from '../../shared/atoms/button/button.component';
import { CardComponent } from '../../shared/atoms/card/card.component';
import { RegisterComponent } from '../register/register.component';

@Component({
  selector: 'app-admin-config',
  standalone: true,
  imports: [ButtonComponent, CardComponent, RegisterComponent, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-config.component.html',
  styleUrls: ['./admin-config.component.css']
})
export class AdminConfigComponent implements OnInit {
  // Señales para estado reactivo del componente
  activeTab = signal<'horarios' | 'estadisticas' | 'pacientes'>('horarios');
  doctors = signal<Doctor[]>([]);
  selectedDoctor = signal<Doctor | null>(null);
  doctorFormMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);
  configFormMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);
  patients = signal<any[]>([]);
  patientSearch = signal<string>('');

  // Referencias a dialogs
  @ViewChild('doctorModal') doctorModal!: ElementRef<HTMLDialogElement>;
  @ViewChild('configModal') configModal!: ElementRef<HTMLDialogElement>;
  @ViewChild('exceptionsModal') exceptionsModal!: ElementRef<HTMLDialogElement>;

  // Excepciones del médico seleccionado
  exceptions = signal<any[]>([]);
  exceptionForm: FormGroup;

  filteredPatients = computed(() => {
  const term = this.patientSearch().toLowerCase().trim();
  if (!term) return this.patients();
  return this.patients().filter(p =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(term) ||
    (p.document || '').toLowerCase().includes(term) ||
    (p.email || '').toLowerCase().includes(term)
  );
});
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
    this.doctorModal?.nativeElement?.close();
  }

  onDoctorModalClose(): void {
    this.selectedDoctor.set(null);
  }

  openConfigModal(): void {
    this.configFormMessage.set(null);
    this.configModal?.nativeElement?.showModal();
  }

  closeConfigModal(): void {
    this.configModal?.nativeElement?.close();
  }

  onConfigModalClose(): void {
  }

  openExceptions(doctor: Doctor): void {
    this.selectedDoctor.set(doctor);
    this.loadExceptions(doctor.id);
    this.exceptionsModal?.nativeElement?.showModal();
  }

  closeExceptionsModal(): void {
    this.exceptionsModal?.nativeElement?.close();
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
    private http: HttpClient,
    private auth: AuthService,
    private doctorService: DoctorService,
    private configService: ConfigService,
    private appointmentService: AppointmentService
  ) {
    // Inicialización del formulario de médico con validaciones
    this.doctorForm = this.fb.group({
      document: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]],
      email: ['', [Validators.required, Validators.email]], 
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
    this.openPatientList();
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
        document: '',   
        email: '',
        name: '',
        scheduleStart: '08:00',
        scheduleEnd: '18:00',
        slotDuration: 30,
        activeDays: [1, 2, 3, 4, 5],
        lunchStart: null,
        lunchEnd: null
      });
      this.syncDaysFromForm([1, 2, 3, 4, 5]);
    }
    this.doctorModal?.nativeElement?.showModal();
  }

  private syncDaysFromForm(days: number[]): void {
    this.selectedDays = days ? days.map(String) : [];
  }

  // Guarda los datos del médico (crea o actualiza)
  saveDoctor(): void {
    const data = this.doctorForm.value;

     if (!data.document) {
        this.doctorFormMessage.set({ type: 'error', text: 'La cédula es obligatoria.' });
        return;
    }
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

          Swal.fire({
            icon: 'success',
            title: 'Médico creado exitosamente',
            html: `
                <div style="text-align: left;">
                    <p><strong>Médico:</strong> ${data.name}</p>
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Contraseña temporal:</strong> 12345678</p>
                    <p style="margin-top: 1rem; color: #e67e22;">⚠️ El médico deberá cambiar su contraseña en el primer inicio de sesión.</p>
                </div>
            `,
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#1e3a6a'
        });
  
        },
        error: (err) => {
          let errorMessage = err.error?.message || 'Error al crear el médico.';
          if (errorMessage.includes('paciente')) {
              errorMessage = 'Esta cédula ya está registrada como paciente.';
          }
           this.doctorFormMessage.set({ type: 'error', text: errorMessage });
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
    }).then((result: any) => {
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
  // GESTIÓN DE PACIENTES
  // ============================================

  loadPatients(): void {
    // Verificar si el usuario está autenticado
    const token = this.auth.getToken();
    if (!token) {
      Swal.fire({
        icon: 'warning',
        title: 'Sesión Expirada',
        text: 'Por favor inicie sesión nuevamente',
        confirmButtonColor: '#3e7ba6'
      });
      return;
    }

    this.http.get<any[]>('http://localhost:3000/patients').subscribe({
      next: (data) => {
        this.patients.set(data);
      },
      error: (err) => {
        console.error('Error cargando pacientes:', err);
        let message = 'No se pudieron cargar los pacientes';
        if (err.status === 401) {
          message = 'Sesión expirada. Por favor inicie sesión nuevamente';
        }
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: message,
          confirmButtonColor: '#3e7ba6'
        });
      }
    });
  }


  openPatientList(): void {
    this.loadPatients();
  }


  showPatients(): void {
    this.activeTab.set('pacientes');
    this.loadPatients();
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

  resetDoctorPassword(doctor: Doctor): void {
  Swal.fire({
    title: '¿Restablecer contraseña?',
    html: `Se restablecerá la contraseña de <strong>Dr(a). ${doctor.name}</strong> a <code>12345678</code>.<br><br>El médico deberá cambiarla en su próximo ingreso.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#1e3a6a',
    cancelButtonColor: '#94a3b8',
    confirmButtonText: 'Sí, restablecer',
    cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.doctorService.resetPassword(doctor.id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Contraseña restablecida',
              text: `La contraseña de Dr(a). ${doctor.name} fue restablecida a 12345678.`,
              confirmButtonColor: '#1e3a6a'
            });
          },
          error: (err: any) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err.error?.message || 'No se pudo restablecer la contraseña.',
              confirmButtonColor: '#1e3a6a'
            });
          }
        });
      }
    });
  }
}


