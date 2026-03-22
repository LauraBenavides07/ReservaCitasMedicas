import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DoctorService, Doctor } from '../../services/doctor.service';
import { ConfigService, GlobalConfig } from '../../services/config.service';

@Component({
  selector: 'app-admin-config',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="admin-config-container">
      <h2 class="text-primary">Panel de Configuración (Administrador)</h2>

      <!-- Pestañas -->
      <nav class="tabs">
        <button [class.active]="activeTab() === 'doctors'" (click)="activeTab.set('doctors')">Médicos / Terapistas</button>
        <button [class.active]="activeTab() === 'global'" (click)="activeTab.set('global')">Ventana de Citas</button>
      </nav>

      <!-- Gestión de Médicos -->
      <section *ngIf="activeTab() === 'doctors'" class="tab-content">
        <div class="section-header">
          <h3>Listado de Médicos</h3>
          <button (click)="openDoctorForm()" class="btn-primary">Añadir Nuevo Médico</button>
        </div>

        <div class="doctor-list">
          <table class="styled-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Especialidad</th>
                <th>Horario</th>
                <th>Duración</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let doctor of doctors()">
                <td>{{ doctor.name }}</td>
                <td>{{ doctor.specialty }}</td>
                <td>{{ doctor.startTime }} - {{ doctor.endTime }}</td>
                <td>{{ doctor.appointmentDuration }} min</td>
                <td class="actions">
                  <button (click)="openDoctorForm(doctor)" class="btn-edit">Editar</button>
                  <button (click)="deleteDoctor(doctor.id)" class="btn-delete">Eliminar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Formulario Médico (Modal simple) -->
        <div *ngIf="showDoctorForm()" class="modal-overlay">
          <div class="modal">
            <h3>{{ selectedDoctor() ? 'Editar Médico' : 'Añadir Médico' }}</h3>
            <form [formGroup]="doctorForm" (ngSubmit)="saveDoctor()" class="form-grid">
              <div class="form-field">
                <label>Nombre Completo</label>
                <input formControlName="name" placeholder="Dr. Juan Perez" />
              </div>
              <div class="form-field">
                <label>Especialidad</label>
                <input formControlName="specialty" placeholder="Fisioterapia" />
              </div>
              <div class="form-field">
                <label>Hora Inicio</label>
                <input type="time" formControlName="startTime" />
              </div>
              <div class="form-field">
                <label>Hora Fin</label>
                <input type="time" formControlName="endTime" />
              </div>
              <div class="form-field">
                <label>Duración Cita (min)</label>
                <input type="number" formControlName="appointmentDuration" />
              </div>
              <div class="modal-actions">
                <button type="submit" class="btn-primary" [disabled]="doctorForm.invalid">Guardar</button>
                <button type="button" (click)="showDoctorForm.set(false)" class="btn-cancel">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <!-- Configuración Global -->
      <section *ngIf="activeTab() === 'global'" class="tab-content">
        <div class="config-card">
          <h3>Reglas de Agendamiento</h3>
          <p>Defina con cuánta antelación y hasta qué fecha pueden agendar los pacientes.</p>

          <form [formGroup]="configForm" (ngSubmit)="saveConfig()" class="form-grid max-400">
            <div class="form-field">
              <label>Antelación Mínima (Horas)</label>
              <input type="number" formControlName="minAdvanceHours" />
              <small>Ej: 2 horas significa que no pueden agendar antes de las próximas 2 horas.</small>
            </div>
            <div class="form-field">
              <label>Horizonte Máximo (Días)</label>
              <input type="number" formControlName="maxFutureDays" />
              <small>Ej: 30 días significa que solo pueden agendar citas para el próximo mes.</small>
            </div>
            <button type="submit" class="btn-primary" [disabled]="configForm.invalid">Actualizar Configuración</button>
          </form>
        </div>
      </section>
    </div>
  `,
  styles: `
    .admin-config-container { background: var(--text-light); padding: 2rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); margin-bottom: 3rem; }
    .tabs { display: flex; gap: 1rem; border-bottom: 2px solid var(--secondary-color); margin-bottom: 2rem; }
    .tabs button { background: none; border: none; padding: 1rem; font-size: 1.1rem; font-weight: bold; cursor: pointer; color: #666; border-bottom: 4px solid transparent; }
    .tabs button.active { color: var(--primary-color); border-bottom-color: var(--primary-color); }
    
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    
    .styled-table { width: 100%; border-collapse: collapse; font-size: 1.1rem; }
    .styled-table th { background: var(--primary-color); color: white; padding: 1rem; text-align: left; }
    .styled-table td { padding: 1rem; border-bottom: 1px solid #eee; }
    
    .btn-edit { background: #fff; border: 2px solid var(--secondary-color); color: var(--secondary-color); padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; margin-right: 0.5rem; }
    .btn-delete { background: #fff; border: 2px solid #c62828; color: #c62828; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; }
    
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: white; padding: 2.5rem; border-radius: 12px; width: 500px; max-width: 90%; }
    
    .config-card { background: var(--bg-soft); padding: 2rem; border-radius: 8px; }
    .max-400 { max-width: 400px; }
    
    .form-grid { display: grid; gap: 1.5rem; }
    .form-field { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-field input { padding: 0.8rem; border: 2px solid var(--secondary-color); border-radius: 8px; font-size: 1.1rem; font-family: inherit; }
    .form-field small { color: #666; font-size: 0.9rem; }
    
    .modal-actions { display: flex; gap: 1rem; margin-top: 1rem; }
    .btn-cancel { background: #eee; border: none; padding: 0.8rem; border-radius: 8px; flex: 1; cursor: pointer; }
    .btn-primary { flex: 1; }
  `
})
export class AdminConfigComponent implements OnInit {
  activeTab = signal<'doctors' | 'global'>('doctors');
  doctors = signal<Doctor[]>([]);
  showDoctorForm = signal(false);
  selectedDoctor = signal<Doctor | null>(null);

  doctorForm: FormGroup;
  configForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private doctorService: DoctorService,
    private configService: ConfigService
  ) {
    this.doctorForm = this.fb.group({
      name: ['', Validators.required],
      specialty: ['', Validators.required],
      startTime: ['08:00', Validators.required],
      endTime: ['12:00', Validators.required],
      appointmentDuration: [30, [Validators.required, Validators.min(10)]]
    });

    this.configForm = this.fb.group({
      minAdvanceHours: [2, Validators.required],
      maxFutureDays: [30, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadDoctors();
    this.loadConfig();
  }

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
    } else {
      this.selectedDoctor.set(null);
      this.doctorForm.reset({ startTime: '08:00', endTime: '12:00', appointmentDuration: 30 });
    }
    this.showDoctorForm.set(true);
  }

  saveDoctor(): void {
    const data = this.doctorForm.value;
    const doc = this.selectedDoctor();
    
    if (doc) {
      this.doctorService.updateDoctor(doc.id, data).subscribe(() => {
        this.loadDoctors();
        this.showDoctorForm.set(false);
      });
    } else {
      this.doctorService.createDoctor(data).subscribe(() => {
        this.loadDoctors();
        this.showDoctorForm.set(false);
      });
    }
  }

  deleteDoctor(id: number): void {
    if (confirm('¿Está seguro de eliminar este médico?')) {
      this.doctorService.deleteDoctor(id).subscribe(() => this.loadDoctors());
    }
  }

  saveConfig(): void {
    this.configService.updateConfig(this.configForm.value).subscribe(() => {
      alert('Configuración actualizada correctamente');
    });
  }
}
