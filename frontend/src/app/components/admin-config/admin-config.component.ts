import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DoctorService, Doctor } from '../../services/doctor.service';
import { ConfigService, GlobalConfig } from '../../services/config.service';
import { AppointmentService } from '../../services/appointment.service';

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
      startTime: ['08:00', Validators.required],
      endTime: ['18:00', Validators.required],
      appointmentDuration: [30, [Validators.required, Validators.min(10)]],
      workingDays: ['1,2,3,4,5', Validators.required],
      breakStart: [null],
      breakEnd: [null]
    });

    // Inicialización del formulario de configuración global
    this.configForm = this.fb.group({
      minAdvanceHours: [2, Validators.required],
      appointmentWindowWeeks: [4, Validators.required]
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
        startTime: '08:00',
        endTime: '18:00',
        appointmentDuration: 30,
        workingDays: '1,2,3,4,5',
        breakStart: null,
        breakEnd: null
      });
    }
    this.showDoctorForm.set(true);
  }

  // Guarda los datos del médico (crea o actualiza)
  saveDoctor(): void {
    const data = this.doctorForm.value;
    const doc = this.selectedDoctor();

    if (doc) {
      // Si existe, actualiza el médico existente
      this.doctorService.updateDoctor(doc.id, data).subscribe(() => {
        this.loadDoctors();
        this.showDoctorForm.set(false);
      });
    } else {
      // Si no existe, crea un nuevo médico
      this.doctorService.createDoctor(data).subscribe(() => {
        this.loadDoctors();
        this.showDoctorForm.set(false);
      });
    }
  }

  // Elimina un médico por su ID
  deleteDoctor(id: number): void {
    if (confirm('¿Está seguro de eliminar este médico?')) {
      this.doctorService.deleteDoctor(id).subscribe(() => this.loadDoctors());
    }
  }

  // Guarda la configuración global
  saveConfig(): void {
    this.configService.updateConfig(this.configForm.value).subscribe(() => {
      this.showGlobalConfig.set(false);
    });
  }

  // ============================================
  // Métodos auxiliares para la interfaz de usuario
  // ============================================

  // Devuelve un color basado en el ID del médico para el avatar
  getDoctorColor(id: number): string {
    const colors = ['#e11d48', '#2563eb', '#7c3aed', '#10b981', '#f59e0b', '#06b6d4'];
    return colors[id % colors.length];  // Selecciona color según módulo del ID
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