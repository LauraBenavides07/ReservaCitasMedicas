// Importaciones necesarias para el componente
import { Component, OnInit, signal, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentService, CreateAppointmentDto } from '../../services/appointment.service';
import { DoctorService, Doctor } from '../../services/doctor.service';
import { AuthService } from '../../services/auth.service';

// Interfaz para representar una fecha en la interfaz de usuario
interface UIDate {
  fullDate: string;   // Fecha en formato YYYY-MM-DD
  dayName: string;    // Nombre abreviado del día (LUN, MAR...)
  dayNum: number;     // Número del día (1-31)
  monthName: string;  // Nombre abreviado del mes (ene, feb...)
}

@Component({
  selector: 'app-patient-appointment-form',     // Selector HTML para usar el componente
  standalone: true,                            // Componente independiente
  imports: [CommonModule],                     // Módulos importados
  templateUrl: './patient-appointment-form.component.html',  // Plantilla HTML
  styleUrls: ['./patient-appointment-form.component.css']    // Estilos CSS
})
export class PatientAppointmentFormComponent implements OnInit {
  // Evento de salida para navegación hacia el componente padre
  @Output() navigate = new EventEmitter<any>();

  // Inyección de dependencias
  auth = inject(AuthService);                          // Servicio de autenticación
  private appointmentService = inject(AppointmentService);  // Servicio de citas
  private doctorService = inject(DoctorService);       // Servicio de médicos

  // Señales para estado reactivo del componente
  step = signal<number>(1);                           // Paso actual del wizard (1-4)
  doctors = signal<Doctor[]>([]);                     // Lista de médicos disponibles
  selectedDoctor = signal<Doctor | null>(null);       // Médico seleccionado

  availableDates = signal<UIDate[]>([]);              // Fechas disponibles para el médico
  selectedDate = signal<UIDate | null>(null);         // Fecha seleccionada

  availableSlots = signal<string[]>([]);              // Horarios disponibles
  selectedTime = signal<string>('');                  // Horario seleccionado

  isSubmitting = signal(false);                       // Estado de envío del formulario
  successMessage = signal('');                        // Mensaje de éxito
  errorMessage = signal('');                          // Mensaje de error

  // Método que se ejecuta al inicializar el componente
  ngOnInit(): void {
    // Carga la lista de médicos desde el servicio
    this.doctorService.getDoctors().subscribe(docs => this.doctors.set(docs));
  }

  // ============================================
  // Métodos auxiliares para formato y colores
  // ============================================

  // Devuelve un color basado en el ID del médico para el avatar
  getDoctorColor(id: string | number): string {
    const colors = ['#2563eb', '#7c3aed', '#10b981', '#e11d48', '#f59e0b', '#06b6d4'];
    const num = typeof id === 'string' ? id.charCodeAt(id.length - 1) : id;
    return colors[num % colors.length];  // Selecciona color según módulo del ID
  }

  // Formatea los días laborales para mostrar nombres abreviados
  formatDays(daysStr: string): string {
    if (!daysStr) return '';
    // Mapeo de números de día a nombres abreviados
    const map: any = { '1': 'Lun', '2': 'Mar', '3': 'Mié', '4': 'Jue', '5': 'Vie', '6': 'Sáb', '7': 'Dom' };
    // Convierte cadena separada por comas en array de nombres
    return daysStr.split(',').map(d => map[d.trim()]).filter(d => Boolean(d)).join(', ');
  }

  // ============================================
  // STEP 1 -> 2: Selección de médico
  // ============================================

  // Selecciona un médico y genera las fechas disponibles
  selectDoctor(doc: Doctor) {
    this.selectedDoctor.set(doc);
    this.generateDates(doc);     // Genera fechas según los días laborales del médico
    this.step.set(2);            // Avanza al paso 2 (fecha)
  }

  // Genera las fechas disponibles basadas en los días laborales del médico
  generateDates(doc: Doctor) {
    const dates: UIDate[] = [];
    const today = new Date();
    // Array de días laborales, por defecto Lunes a Viernes si no está configurado
    const workingDaysArray = doc.activeDays ? doc.activeDays.split(',').map(Number) : [1, 2, 3, 4, 5];

    // Arrays para nombres de días y meses en español
    const dayNames = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

    // Genera fechas para los próximos 28 días (incluyendo hoy)
    for (let i = 0; i <= 28; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);

      // Obtiene el día de la semana (0 domingo, 1 lunes...)
      let dayOfWeek = d.getDay();
      if (dayOfWeek === 0) dayOfWeek = 7;  // Convierte domingo de 0 a 7 para facilitar comparación

      // Incluye solo si el día está en los días laborales del médico
      if (workingDaysArray.includes(dayOfWeek)) {
        dates.push({
          fullDate: d.toLocaleDateString('en-CA'),  // Formato YYYY-MM-DD local
          dayName: dayNames[d.getDay()],
          dayNum: d.getDate(),
          monthName: monthNames[d.getMonth()]
        });
      }
    }
    this.availableDates.set(dates);
  }

  // ============================================
  // STEP 2 -> 3: Selección de fecha
  // ============================================

  // Selecciona una fecha y carga los horarios disponibles
  selectDate(d: UIDate) {
    this.selectedDate.set(d);
    this.selectedTime.set('');   // Limpia horario seleccionado anterior

    const docId = this.selectedDoctor()!.id;
    // Consulta al servicio para obtener los horarios disponibles para ese médico y fecha
    this.appointmentService.getAvailableSlots(docId, d.fullDate).subscribe({
      next: (slots) => {
        this.availableSlots.set(slots);
        this.step.set(3);        // Avanza al paso 3 (hora)
      },
      error: () => this.availableSlots.set([])  // En caso de error, lista vacía
    });
  }

  // ============================================
  // STEP 3 -> 4: Selección de hora
  // ============================================

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

  // Selecciona un horario y avanza al paso de confirmación
  selectTime(time: string) {
    this.selectedTime.set(time);
    this.step.set(4);            // Avanza al paso 4 (confirmación)
  }

  // ============================================
  // STEP 4: Confirmar y guardar cita
  // ============================================

  // Confirma la cita y la guarda en el servidor
  confirmAppointment() {
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const user = this.auth.user();
    if (!user) return;  // Si no hay usuario autenticado, no continúa

    // Construye el DTO (Data Transfer Object) para crear la cita
    const dto: CreateAppointmentDto = {
      patientDocument: user.document || '00000000',
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '0000000000',
      gender: user.gender || 'Otro',
      doctorId: this.selectedDoctor()!.id,
      date: this.selectedDate()!.fullDate,
      time: this.selectedTime()
    };

    // Envía la solicitud al servicio
    this.appointmentService.createAppointment(dto).subscribe({
      next: () => {
        this.successMessage.set('Cita agendada con éxito. Redirigiendo...');
        this.isSubmitting.set(false);
        // Redirige al dashboard del paciente después de 2 segundos
        setTimeout(() => this.navigate.emit('patient-dashboard'), 2000);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Error al confirmar la cita.');
        this.isSubmitting.set(false);
      }
    });
  }

  // ============================================
  // Utilidades de navegación
  // ============================================

  // Navega a un paso específico (solo permite retroceder)
  goToStep(s: number) {
    if (s < this.step()) this.step.set(s);
  }

  // Obtiene la fecha seleccionada en formato legible para humanos
  getFullDateHuman(): string {
    const sd = this.selectedDate();
    if (!sd) return '';
    const d = new Date(sd.fullDate + 'T12:00:00');
    // Arrays con nombres completos de días y meses
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    // Formato: "lunes, 15 de enero de 2024"
    return `${dias[d.getDay()]}, ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
  }
}