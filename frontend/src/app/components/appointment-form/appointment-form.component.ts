import { Component, OnInit, signal, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppointmentService, CreateAppointmentDto } from '../../services/appointment.service';
import { DoctorService, Doctor } from '../../services/doctor.service';
import { AuthService } from '../../services/auth.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="appointment-form-container">
      <h2 class="text-primary" *ngIf="!isPatientView">Crear Cita Manual (WhatsApp)</h2>
      <p *ngIf="!isPatientView">Registre al paciente y asigne un horario disponible.</p>

      <form [formGroup]="appointmentForm" (ngSubmit)="onSubmit()" class="form-grid">
        <!-- Datos del Paciente (Solo en vista Admin) -->
        <fieldset class="section" *ngIf="!isPatientView">
          <legend>Datos del Paciente</legend>
          
          <div class="form-field">
            <label for="document">Documento de Identidad *</label>
            <input id="document" type="text" formControlName="patientDocument" placeholder="Ej: 12345678" />
            <div *ngIf="f['patientDocument'].touched && f['patientDocument'].errors" class="error">
              El documento es requerido.
            </div>
          </div>

          <div class="form-field">
            <label for="firstName">Nombres *</label>
            <input id="firstName" type="text" formControlName="firstName" placeholder="Ej: Juan" />
          </div>

          <div class="form-field">
            <label for="lastName">Apellidos *</label>
            <input id="lastName" type="text" formControlName="lastName" placeholder="Ej: Pérez" />
          </div>

          <div class="form-field">
            <label for="phone">Celular *</label>
            <input id="phone" type="tel" formControlName="phone" placeholder="Ej: 3001234567" />
          </div>

          <div class="form-field">
            <label for="gender">Género *</label>
            <select id="gender" formControlName="gender">
              <option value="">Seleccione...</option>
              <option value="Hombre">Hombre</option>
              <option value="Mujer">Mujer</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div class="form-field">
            <label for="birthDate">Fecha de Nacimiento (Opcional)</label>
            <input id="birthDate" type="date" formControlName="birthDate" />
          </div>

          <div class="form-field">
            <label for="email">Correo Electrónico (Opcional)</label>
            <input id="email" type="email" formControlName="email" placeholder="Ej: ana@ejemplo.com" />
          </div>
        </fieldset>

        <!-- Datos de la Cita -->
        <fieldset class="section">
          <legend>Datos de la Cita</legend>

          <div class="form-field">
            <label for="doctor">Médico/Terapista *</label>
            <select id="doctor" formControlName="doctorId" (change)="onDoctorChange()">
              <option value="">Seleccione un médico...</option>
              <option *ngFor="let doctor of doctors()" [value]="doctor.id">
                {{ doctor.name }} - {{ doctor.specialty }}
              </option>
            </select>
          </div>

          <div class="form-field">
            <label for="date">Fecha de la Cita *</label>
            <input id="date" type="date" formControlName="date" (change)="onDateChange()" [min]="today" />
          </div>

          <div class="form-field">
            <label for="time">Hora de la Cita *</label>
            <select id="time" formControlName="time">
              <option value="">Seleccione un horario...</option>
              <option *ngFor="let slot of availableSlots()" [value]="slot">{{ slot }}</option>
            </select>
            <div *ngIf="f['doctorId'].value && f['date'].value && availableSlots().length === 0" class="info">
              No hay horarios disponibles para esta fecha.
            </div>
          </div>
        </fieldset>

        <div class="form-actions">
          <button type="submit" class="btn-primary" [disabled]="appointmentForm.invalid || isSubmitting()">
            {{ isSubmitting() ? 'Guardando...' : 'Confirmar Cita' }}
          </button>
        </div>

        <div *ngIf="successMessage()" class="alert-success">
          {{ successMessage() }}
        </div>

        <div *ngIf="errorMessage()" class="alert-error">
          {{ errorMessage() }}
        </div>
      </form>
    </div>
  `,
  styles: `
    .appointment-form-container {
      background: var(--text-light);
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }

    .form-grid {
      display: grid;
      gap: 2rem;
    }

    .section {
      border: 1px solid var(--secondary-color);
      border-radius: 8px;
      padding: 1.5rem;
      display: grid;
      gap: 1rem;
    }

    legend {
      font-weight: bold;
      color: var(--primary-color);
      padding: 0 0.5rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    label {
      font-weight: 600;
    }

    input, select {
      border: 2px solid var(--secondary-color);
      border-radius: 8px;
      padding: 0.5rem 1rem;
      font-size: 1.1rem;
    }

    input:focus, select:focus {
      outline: none;
      border-color: var(--primary-color);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
    }

    .btn-primary {
      background-color: var(--primary-color);
      color: var(--text-light);
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 8px;
      font-size: 1.2rem;
      font-weight: bold;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .error { color: #d32f2f; font-size: 0.9rem; margin-top: 0.2rem; }
    .info { color: var(--primary-color); font-size: 0.9rem; margin-top: 0.2rem; }

    .alert-success {
      background-color: #e8f5e9;
      color: #2e7d32;
      padding: 1rem;
      border-radius: 8px;
      margin-top: 1rem;
      font-weight: bold;
    }

    .alert-error {
      background-color: #ffebee;
      color: #c62828;
      padding: 1rem;
      border-radius: 8px;
      margin-top: 1rem;
      font-weight: bold;
    }

    @media (min-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr 1fr;
      }
      .form-actions {
        grid-column: span 2;
      }
      .alert-success, .alert-error {
        grid-column: span 2;
      }
    }
  `
})
export class AppointmentFormComponent implements OnInit {
  @Input() isPatientView = false;
  
  auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private appointmentService = inject(AppointmentService);
  private doctorService = inject(DoctorService);

  appointmentForm!: FormGroup;
  doctors = signal<Doctor[]>([]);
  availableSlots = signal<string[]>([]);
  isSubmitting = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  today = new Date().toISOString().split('T')[0];

  ngOnInit(): void {
    this.initForm();
    this.loadDoctors();
  }

  private initForm(): void {
    const user = this.auth.user();
    this.appointmentForm = this.fb.group({
      patientDocument: [this.isPatientView ? user?.document : '', [Validators.required]],
      firstName: [this.isPatientView ? user?.firstName : '', [Validators.required]],
      lastName: [this.isPatientView ? user?.lastName : '', [Validators.required]],
      phone: [this.isPatientView ? user?.phone : '', [Validators.required]],
      gender: [this.isPatientView ? user?.gender : '', [Validators.required]],
      birthDate: [null],
      email: [null, [Validators.email]],
      doctorId: ['', [Validators.required]],
      date: [this.today, [Validators.required]],
      time: ['', [Validators.required]]
    });

    if (this.isPatientView && user) {
      // Bloqueamos todos los campos personales que ya conocemos
      this.f['patientDocument'].disable();
      this.f['firstName'].disable();
      this.f['lastName'].disable();
      this.f['phone'].disable();
      this.f['gender'].disable();
    }
  }

  get f() { return this.appointmentForm.controls; }

  loadDoctors(): void {
    this.doctorService.getDoctors().subscribe({
      next: (data) => this.doctors.set(data),
      error: () => this.errorMessage.set('Error al cargar la lista de médicos.')
    });
  }

  onDoctorChange(): void {
    this.f['time'].setValue('');
    this.loadAvailableSlots();
  }

  onDateChange(): void {
    this.f['time'].setValue('');
    this.loadAvailableSlots();
  }

  loadAvailableSlots(): void {
    const doctorId = this.f['doctorId'].value;
    const date = this.f['date'].value;

    if (doctorId && date) {
      this.appointmentService.getAvailableSlots(Number(doctorId), date).subscribe({
        next: (slots) => this.availableSlots.set(slots),
        error: () => {
          this.availableSlots.set([]);
          this.errorMessage.set('Error al cargar horarios disponibles.');
        }
      });
    } else {
      this.availableSlots.set([]);
    }
  }

  onSubmit(): void {
    if (this.appointmentForm.invalid) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const formValue = this.appointmentForm.getRawValue();
    const dto: CreateAppointmentDto = {
      patientDocument: formValue.patientDocument,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      phone: formValue.phone,
      gender: formValue.gender,
      doctorId: Number(formValue.doctorId),
      date: formValue.date,
      time: formValue.time
    };

    if (formValue.birthDate) dto.birthDate = formValue.birthDate;
    if (formValue.email) dto.email = formValue.email;

    this.appointmentService.createAppointment(dto).pipe(
      catchError(err => {
        this.errorMessage.set(err.error?.message || 'Error al crear la cita.');
        this.isSubmitting.set(false);
        return of(null);
      })
    ).subscribe(result => {
      if (result) {
        this.successMessage.set('Cita agendada con éxito.');
        this.appointmentForm.reset({
          date: this.today,
          doctorId: dto.doctorId
        });
        this.availableSlots.set([]);
        this.loadAvailableSlots(); // Recargar slots
      }
      this.isSubmitting.set(false);
    });
  }
}
