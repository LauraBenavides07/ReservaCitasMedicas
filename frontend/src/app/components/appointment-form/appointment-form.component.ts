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
  templateUrl: './appointment-form.component.html',
  styleUrls: ['./appointment-form.component.css']
})
export class AppointmentFormComponent implements OnInit {

  // Indica si el formulario es para paciente autenticado
  @Input() isPatientView = false;

  // Inyección de servicios
  auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private appointmentService = inject(AppointmentService);
  private doctorService = inject(DoctorService);

  // Formulario
  appointmentForm!: FormGroup;

  // Signals
  doctors = signal<Doctor[]>([]);
  availableSlots = signal<string[]>([]);
  isSubmitting = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  // Fecha actual
  today = new Date().toLocaleDateString('en-CA');

  ngOnInit(): void {
    this.initForm();
    this.loadDoctors();
  }

  // Inicializa el formulario
  private initForm(): void {
    const user = this.auth.user();

    this.appointmentForm = this.fb.group({
      patientDocument: [this.isPatientView ? user?.document : '', [Validators.required]],
      firstName: [this.isPatientView ? user?.firstName : '', [Validators.required]],
      lastName: [this.isPatientView ? user?.lastName : '', [Validators.required]],
      phone: [this.isPatientView ? user?.phone : '', [Validators.required]],
      gender: [this.isPatientView ? user?.gender : '', [Validators.required]],
      email: [null, [Validators.email]],
      doctorId: ['', [Validators.required]],
      date: [this.today, [Validators.required]],
      time: ['', [Validators.required]]
    });

    // Si es paciente, bloquea campos
    if (this.isPatientView && user) {
      this.f['patientDocument'].disable();
      this.f['firstName'].disable();
      this.f['lastName'].disable();
      this.f['phone'].disable();
      this.f['gender'].disable();
    }
  }

  // Getter de controles
  get f() {
    return this.appointmentForm.controls;
  }

  // Carga doctores
  loadDoctors(): void {
    this.doctorService.getDoctors().subscribe({
      next: (data) => this.doctors.set(data),
      error: () => this.errorMessage.set('Error al cargar la lista de medicos.')
    });
  }

  // Busca paciente por documento
  searchPatient(): void {
    const document = this.f['patientDocument'].value;
    if (!document) {
      this.f['patientDocument'].markAsTouched();
      this.errorMessage.set('');
      return;
    }

    this.errorMessage.set('');
    this.appointmentService.getPatientByDocument(document).subscribe({
      next: (patient) => {
        this.appointmentForm.patchValue({
          firstName: patient.firstName,
          lastName: patient.lastName,
          phone: patient.phone,
          gender: patient.gender,
          email: patient.email
        });
        this.successMessage.set('Paciente encontrado.');
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: () => {
        this.errorMessage.set('Paciente no encontrado. Ingrese los datos manualmente.');
        // Opcional: limpiar campos si se desea un comportamiento mas estricto
      }
    });
  }

  // Cambio de doctor
  onDoctorChange(): void {
    this.f['time'].setValue('');
    this.loadAvailableSlots();
  }

  // Seleccionar doctor
  selectDoctor(id: string): void {
    this.f['doctorId'].setValue(id);
    this.onDoctorChange();
  }

  // Genera color del avatar
  getDoctorColor(id: string | number): string {
    const colors = ['#ef4444', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4'];
    const num = typeof id === 'string' ? id.charCodeAt(id.length - 1) : id;
    return colors[num % colors.length];
  }

  // Cambio de fecha
  onDateChange(): void {
    this.f['time'].setValue('');
    this.loadAvailableSlots();
  }

  // Carga horarios disponibles
  loadAvailableSlots(): void {
    const doctorId = this.f['doctorId'].value;
    const date = this.f['date'].value;

    if (doctorId && date) {
      this.appointmentService.getAvailableSlots(doctorId, date).subscribe({
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

  // Envío del formulario
  onSubmit(): void {

    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      this.errorMessage.set('Por favor, complete todos los campos obligatorios (*).');
      
      // Hacer scroll hacia arriba para que el usuario vea los errores
      const wrapper = document.querySelector('.appointment-form-wrapper');
      if (wrapper) wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const formValue = this.appointmentForm.getRawValue();

    // DTO para enviar al backend
    const dto: CreateAppointmentDto = {
      patientDocument: formValue.patientDocument,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      phone: formValue.phone,
      gender: formValue.gender,
      doctorId: formValue.doctorId,
      date: formValue.date,
      time: formValue.time
    };

    // Campos opcionales
    if (formValue.email) dto.email = formValue.email;

    // Llamada al servicio
    this.appointmentService.createAppointment(dto).pipe(
      catchError(err => {
        this.errorMessage.set(err.error?.message || 'Error al crear la cita.');
        this.isSubmitting.set(false);
        return of(null);
      })
    ).subscribe(result => {

      if (result) {
        this.successMessage.set('✅ Cita agendada con éxito.');

        // Reinicia formulario
        this.appointmentForm.reset({
          date: this.today,
          doctorId: dto.doctorId
        });

        this.availableSlots.set([]);
        this.loadAvailableSlots();
        
        // Hacer scroll hacia arriba para que el usuario vea el mensaje de éxito
        const wrapper = document.querySelector('.appointment-form-wrapper');
        if (wrapper) wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Opcional: ocultar el mensaje de éxito después de unos segundos
        setTimeout(() => this.successMessage.set(''), 4000);
      }

      this.isSubmitting.set(false);
    });
  }
}