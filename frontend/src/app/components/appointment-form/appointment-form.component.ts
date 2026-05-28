import { Component, OnInit, signal, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppointmentService, CreateAppointmentDto } from '../../services/appointment.service';
import { DoctorService, Doctor } from '../../services/doctor.service';
import { AuthService } from '../../services/auth.service';
import { catchError, of } from 'rxjs';
import Swal from 'sweetalert2';
import { ButtonComponent } from '../../shared/atoms/button/button.component';
import { FormFieldComponent } from '../../shared/atoms/form-field/form-field.component';
import { CardComponent } from '../../shared/atoms/card/card.component';
import { AlertComponent } from '../../shared/atoms/alert/alert.component';
import { DoctorCardComponent } from '../../shared/molecules/doctor-card/doctor-card.component';

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [DoctorCardComponent, AlertComponent,ButtonComponent, CardComponent, FormFieldComponent, CommonModule, ReactiveFormsModule],
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
  isLoadingSlots = signal(false);

  // Fecha actual
  today = new Date().toLocaleDateString('en-CA');

  // Configuración de anticipación
  minAdvanceHours = 2;
  maxAppointmentDays = 15;

  ngOnInit(): void {
    this.initForm();
    this.loadDoctors();
    
    // Escuchar cambios en doctorId para habilitar/deshabilitar fecha
    this.f['doctorId'].valueChanges.subscribe(value => {
        if (value) {
            this.f['date'].enable();
        } else {
            this.f['date'].disable();
            this.f['time'].disable();
        }
    });
    
    // Escuchar cambios en fecha para habilitar/deshabilitar hora
    this.f['date'].valueChanges.subscribe(value => {
        if (value && !this.isDateDisabled(value)) {
            this.f['time'].enable();
        } else {
            this.f['time'].disable();
        }
    });
}

  // Inicializa el formulario
  private initForm(): void {
    const user = this.auth.user();

    if (this.isPatientView && user) {
      // Para paciente: campos deshabilitados desde la creación
      this.appointmentForm = this.fb.group({
        patientDocument: [{ value: user.document || '', disabled: true }, [Validators.required]],
        firstName: [{ value: user.firstName || '', disabled: true }, [Validators.required]],
        lastName: [{ value: user.lastName || '', disabled: true }, [Validators.required]],
        phone: [{ value: user.phone || '', disabled: true }, [Validators.required]],
        gender: [{ value: user.gender || '', disabled: true }, [Validators.required]],
        email: [{ value: null, disabled: false }, [Validators.email]],
        doctorId: ['', [Validators.required]],
        date: [this.today, [Validators.required]],
        time: ['', [Validators.required]]
      });
    } else {
      // Para admin/staff: todos los campos habilitados
      this.appointmentForm = this.fb.group({
        patientDocument: ['', [Validators.required]],
        firstName: ['', [Validators.required]],
        lastName: ['', [Validators.required]],
        phone: ['', [Validators.required]],
        gender: ['', [Validators.required]],
        email: [null, [Validators.email]],
        doctorId: ['', [Validators.required]],
        date: [this.today, [Validators.required]],
        time: ['', [Validators.required]]
      });
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
      return;
    }

    this.showLoadingToast('Buscando paciente...');

    this.appointmentService.getPatientByDocument(document).subscribe({
      next: (patient) => {
        Swal.close();
        this.errorMessage.set('');
        
        if (this.isPatientView) {
          // Si está deshabilitado, no se puede modificar
          this.showInfoToast('Paciente ya autenticado');
        } else {
          this.f['firstName'].setValue(patient.firstName);
          this.f['lastName'].setValue(patient.lastName);
          this.f['phone'].setValue(patient.phone);
          this.f['gender'].setValue(patient.gender);
          if (patient.email) this.f['email'].setValue(patient.email);
          this.showSuccessToast('Paciente encontrado');
        }
      },
      error: () => {
        Swal.close();
        this.errorMessage.set('Paciente no encontrado. Complete los datos manualmente.');
        this.showErrorToast('Paciente no encontrado. Complete los datos manualmente.');
      }
    });
  }

  // Cambio de doctor
  onDoctorChange(): void {
    this.f['time'].setValue('');
    this.setNextWorkingDay();
    this.loadAvailableSlots();
  }

  // Preselecciona el próximo día hábil según el médico seleccionado
  private setNextWorkingDay(): void {
    const doctorId = this.f['doctorId'].value;
    const doctor = this.doctors().find(d => d.id === doctorId);
    if (!doctor) return;

    const today = new Date();
    const workingDays = doctor.activeDays ?? [1, 2, 3, 4, 5];

    for (let i = 0; i <= 14; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      let dow = d.getDay();
      if (dow === 0) dow = 7;
      if (workingDays.includes(dow)) {
        this.f['date'].setValue(d.toLocaleDateString('en-CA'));
        return;
      }
    }
  }

  // Verifica si una fecha debe estar deshabilitada (sin slots disponibles)
  isDateDisabled(dateStr: string): boolean {
  if (!dateStr) return false;
  
  const selectedDate = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const maxDate = new Date();
  maxDate.setDate(now.getDate() + this.maxAppointmentDays);
  
  // 🚨 1. PRIMERO: Validar si el médico trabaja ese día (FIN DE SEMANA)
  const doctorId = this.f['doctorId'].value;
  if (doctorId) {
    const doctor = this.doctors().find(d => d.id === doctorId);
    if (doctor && doctor.activeDays) {
      let dow = selectedDate.getDay();
      if (dow === 0) dow = 7;
      if (!doctor.activeDays.includes(dow)) {
        return true; // Día no laboral para este médico
      }
    }
  }
  
  // 2. Validar anticipación mínima (solo si el día es laboral)
  const diffHours = (selectedDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (diffHours < this.minAdvanceHours) {
    return true;
  }
  
  // 3. Validar ventana máxima (solo si el día es laboral)
  if (selectedDate > maxDate) {
    return true;
  }
  
  return false;
}

  // Obtiene mensaje de por qué una fecha está deshabilitada
  getDisabledDateReason(dateStr: string): string {
  if (!dateStr) return '';
  
  const selectedDate = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const maxDate = new Date();
  maxDate.setDate(now.getDate() + this.maxAppointmentDays);
  const diffHours = (selectedDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  //  1. PRIMERO: Validar día laboral (FIN DE SEMANA)
  const doctorId = this.f['doctorId'].value;
  if (doctorId) {
    const doctor = this.doctors().find(d => d.id === doctorId);
    if (doctor && doctor.activeDays) {
      let dow = selectedDate.getDay();
      if (dow === 0) dow = 7;
      if (!doctor.activeDays.includes(dow)) {
        const dayNames: Record<number, string> = { 
          1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 
          4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo'
        };
        return `El médico no atiende los ${dayNames[dow]}`; 
      }
    }
  }
  
  // 2. Validar anticipación mínima (solo si el día es laboral)
  if (diffHours < this.minAdvanceHours) {
    return `Requiere ${this.minAdvanceHours} horas de anticipación`;
  }
  
  // 3. Validar ventana máxima (solo si el día es laboral)
  if (selectedDate > maxDate) {
    return `Máximo ${this.maxAppointmentDays} días de anticipación`;
  }
  
  return '';
}

  // Seleccionar doctor
  selectDoctor(id: string): void {
    this.f['doctorId'].setValue(id);
    this.onDoctorChange();
  }

  // Cambio de fecha
  onDateChange(): void {
    this.f['time'].setValue('');
    this.loadAvailableSlots();
  }
// Método auxiliar para obtener nombre del día
  private getDayName(dow: number): string {
    const days: Record<number, string> = {
      1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
      4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo'
    };
    return days[dow] || 'día';
  }
  // Carga horarios disponibles
 loadAvailableSlots(): void {
  const doctorId = this.f['doctorId'].value;
  const date = this.f['date'].value;

  if (!doctorId || !date) {
    this.availableSlots.set([]);
    return;
  }

  // Primero verificar si es fin de semana
  const selectedDate = new Date(date + 'T00:00:00');
  let dow = selectedDate.getDay();
  if (dow === 0) dow = 7;
  
  const doctor = this.doctors().find(d => d.id === doctorId);
  if (doctor && doctor.activeDays) {
    if (!doctor.activeDays.includes(dow)) {
      this.availableSlots.set([]);
      const dayNames: Record<number, string> = { 
        1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 
        4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo'
      };
      this.errorMessage.set(`El médico no atiende los ${dayNames[dow]}`);
      return;
    }
  }

  if (this.isDateDisabled(date)) {
    this.availableSlots.set([]);
    this.errorMessage.set(this.getDisabledDateReason(date));
    return;
  }

  this.errorMessage.set('');
  this.isLoadingSlots.set(true);

  this.appointmentService.getAvailableSlots(doctorId, date).subscribe({
    next: (slots) => {
      this.availableSlots.set(slots);
      this.isLoadingSlots.set(false);
      
      if (slots.length === 0) {
        this.errorMessage.set('No hay horarios disponibles para esta fecha');
      }
    },
    error: () => {
      this.availableSlots.set([]);
      this.isLoadingSlots.set(false);
      this.showErrorToast('Error al cargar horarios');
    }
  });
}


  
  formatSlot(slot: string): string {
    if (!slot) return '';
    try {
      const [h, m] = slot.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
    } catch {
      return slot;
    }
  }

  // ============================================
// TOASTS CON SweetAlert2
// ============================================

private showSuccessToast(message: string): void {
    Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        background: '#1d86b7',
        color: 'white'
    });
}

private showErrorToast(message: string): void {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
        background: '#ef4444',
        color: 'white'
    });
}

private showInfoToast(message: string): void {
    Swal.fire({
        icon: 'info',
        title: 'Información',
        text: message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: '#3b82f6',
        color: 'white'
    });
}
  private showLoadingToast(message: string): void {
    Swal.fire({
      title: message,
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });
  }

  // Envío del formulario
  onSubmit(): void {
    if (this.isSubmitting()) return;

    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      this.showErrorToast('Complete todos los campos obligatorios');
      return;
    }

    const selectedTime = this.f['time'].value;
    if (selectedTime && !this.availableSlots().includes(selectedTime)) {
      this.showErrorToast('Este horario ya no está disponible. Selecciona otro.');
      this.f['time'].setValue('');
      this.loadAvailableSlots();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formValue = this.appointmentForm.getRawValue();
    
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

    if (formValue.email) dto.email = formValue.email;

    this.showLoadingToast('Creando cita...');

    this.appointmentService.createAppointment(dto).pipe(
      catchError(err => {
        Swal.close();
        this.isSubmitting.set(false);
        
        const raw = err.error?.message || err.message || 'Error al crear la cita';
        const errorMessage = Array.isArray(raw) ? raw[0] || raw.join(', ') : raw;
        
        if (errorMessage.includes('horario ya está ocupado')) {
          this.showErrorToast('Este horario ya fue tomado. Selecciona otro.');
          this.f['time'].setValue('');
          this.loadAvailableSlots();
        } else if (errorMessage.includes('horas de anticipación')) {
          this.showErrorToast(errorMessage);
        } else if (errorMessage.includes('días')) {
          this.showErrorToast(errorMessage);
        } else {
          this.showErrorToast(errorMessage);
        }
        
        return of(null);
      })
    ).subscribe(result => {
      if (result) {
        Swal.close();
        
        const doctor = this.doctors().find(d => d.id === formValue.doctorId);
        const doctorName = doctor?.name || 'médico';
        const patientName = `${formValue.firstName} ${formValue.lastName}`;

        Swal.fire({
          icon: 'success',
          title: '¡Cita agendada!',
          html: `
            <div style="text-align: left; margin-top: 1rem;">
              <p><strong>Paciente:</strong> ${patientName}</p>
              <p><strong>Médico:</strong> Dr(a). ${doctorName}</p>
              <p><strong>Fecha:</strong> ${formValue.date}</p>
              <p><strong>Hora:</strong> ${formValue.time}</p>
            </div>
          `,
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#1d86b7'
        });

        // Esto permite que el dashboard se actualice automáticamente
         window.dispatchEvent(new CustomEvent('appointment-created', { detail: result }));

        // Resetear formulario manteniendo campos de paciente si está deshabilitado
        if (!this.isPatientView) {
          this.appointmentForm.reset({
            date: this.today
          });
        } else {
          const user = this.auth.user();
          this.appointmentForm.patchValue({
            date: this.today,
            time: ''
          });
        }
        this.availableSlots.set([]);
      }
      this.isSubmitting.set(false);
    });
  }
}
