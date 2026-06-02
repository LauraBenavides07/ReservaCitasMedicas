import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';

// Servicios y modelos
import { AppointmentService, Appointment, AppointmentResponse } from '../../services/appointment.service';
import { DoctorService, Doctor } from '../../services/doctor.service';
import { ButtonComponent } from '../../shared/atoms/button/button.component';
import { BadgeComponent } from '../../shared/atoms/badge/badge.component';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [BadgeComponent, ButtonComponent, CommonModule, FormsModule],
  templateUrl: './appointment-list.component.html',
  styleUrls: ['./appointment-list.component.css']
})
export class AppointmentListComponent implements OnInit {
  
  //modo de vista
  viewMode: 'all' | 'filter' = 'all';

  // Lista de citas
  appointments: Appointment[] = [];

  // Lista de doctores
  doctors: Doctor[] = [];

  // Total de citas
  total: number = 0;

  // Doctor seleccionado
  selectedDoctorId: string | null = null;

  // Fecha seleccionada (por defecto hoy, formato local)
  selectedDate: string = new Date().toLocaleDateString('en-CA');

  // Estado de carga
  loading: boolean = false;

  // Indica si ya se hizo una búsqueda
  hasSearched: boolean = false;

  // Rescheduling state
  @ViewChild('rescheduleModal') rescheduleModal!: ElementRef<HTMLDialogElement>;
  selectedAppointment: Appointment | null = null;
  newRescheduleDate: string = '';
  newRescheduleTime: string = '';
  availableSlots: string[] = [];
  isLoadingSlots: boolean = false;
  rescheduleDoctorId: string = '';
  touchedRescheduleDate: boolean = false;
  touchedRescheduleTime: boolean = false;

  trackById(index: number, appt: Appointment): string {
    return appt.id;
  }

  constructor(
    private appointmentService: AppointmentService,
    private doctorService: DoctorService,
    private cdr: ChangeDetectorRef
  ) { }

  // Se ejecuta al iniciar el componente
  ngOnInit(): void {
    this.loadDoctors();
  }

  // Carga la lista de doctores
  loadDoctors(): void {
    this.doctorService.getDoctors().subscribe({
      next: (docs) => {
        this.doctors = docs;

        // Selecciona el primer doctor automáticamente
        if (docs.length > 0) {
          this.selectedDoctorId = docs[0].id;
        } else {
          this.selectedDoctorId = null;
        }

        // Fuerza actualización de la vista
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading doctors:', err);
      }
    });
  }


  // Carga citas según doctor y fecha
  loadAppointments(): void {

    // Validación
    if (!this.selectedDoctorId || !this.selectedDate) return;

    this.loading = true; // Activa loading
    this.cdr.detectChanges();

    this.appointmentService
      .getAppointments(this.selectedDoctorId, this.selectedDate)
      .pipe(
        // Se ejecuta siempre al finalizar (éxito o error)
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res: AppointmentResponse) => {
          // Asigna resultados
          this.appointments = res.appointments || [];
          this.total = res.total || 0;
        },
        error: (err) => {
          console.error('Error loading appointments:', err);
        }
      });
  }

  // Devuelve la clase CSS según el estado (legacy - usada en otros componentes)
  getStatusClass(status: string | undefined): string {
    if (!status) return 'badge-desconocido';
    return `badge-${status.toLowerCase()}`;
  }

  // Clase del badge con prefijo al- para el nuevo diseño
  getAlBadgeClass(status: string | undefined): string {
    if (!status) return 'al-badge--desconocido';
    return `al-badge--${status.toLowerCase()}`;
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr + 'T12:00:00');
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  }

  formatTime(timeStr: string | undefined): string {
    if (!timeStr) return '';
    try {
      const [h, m] = timeStr.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
    } catch {
      return timeStr;
    }
  }

    // Cargar TODAS las citas
  loadAllAppointments(): void {
  this.loading = true;
  this.viewMode = 'all';
  this.hasSearched = true;
  
  this.appointmentService.getAllAppointments()
    .pipe(finalize(() => {
      this.loading = false;
      this.cdr.detectChanges();
    }))
    .subscribe({
      next: (data) => {
        // ORDENAR: De más reciente a más antigua 
        this.appointments = data.sort((a, b) => {
          // Primero ordenar por fecha (descendente)
          const dateA = a.appointmentDate || a.date;
          const dateB = b.appointmentDate || b.date;
          
          if (dateA !== dateB) {
            return dateB.localeCompare(dateA); // Más reciente primero
          }
          
          // Si misma fecha, ordenar por hora (descendente)
          const timeA = a.appointmentTime || a.time;
          const timeB = b.appointmentTime || b.time;
          return timeB.localeCompare(timeA);
        });
        
        this.total = this.appointments.length;
      },
      error: (err) => console.error('Error loading all appointments:', err)
    });
}

// Buscar por medico y fecha
onSearch(): void {
  if (!this.selectedDoctorId || !this.selectedDate) return;
  
  this.loading = true;
  this.viewMode = 'filter'; 
  this.hasSearched = true;

  this.appointmentService
    .getAppointments(this.selectedDoctorId, this.selectedDate)
    .pipe(finalize(() => {
      this.loading = false;
      this.cdr.detectChanges();
    }))
    .subscribe({
      next: (res: AppointmentResponse) => {
        this.appointments = res.appointments || [];
        this.total = res.total || 0;
      },
      error: (err) => console.error('Error loading appointments:', err)
    });
  }

  exportCsv(): void {
    if (!this.selectedDoctorId || !this.selectedDate) {
        Swal.fire({
            icon: 'warning',
            title: 'Filtros requeridos',
            text: 'Por favor selecciona un médico y una fecha antes de exportar.',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#1e3a6a',
            customClass: {
                popup: 'custom-popup',
                title: 'custom-title',
                confirmButton: 'custom-confirm-btn'
            }
        });
        return;
    }

    Swal.fire({
    title: 'Generando archivo...',
    text: 'Por favor espera',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
    customClass: {
      popup: 'custom-popup',
      title: 'custom-title'
    }
  });

  this.appointmentService
  .exportAppointments(this.selectedDate, this.selectedDoctorId)
    .subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `citas-${this.selectedDate}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
                
        Swal.fire({
          icon: 'success',
          title: 'Exportación exitosa',
          text: 'El archivo CSV se ha descargado correctamente.',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#2e67b8',
          customClass: {
            popup: 'custom-popup',
            title: 'custom-title',
            confirmButton: 'custom-success-btn'
            }
          });
        },
        error: () => {
          Swal.fire({
          icon: 'error',
          title: 'No se pudo exportar',
          text: 'No hay citas para exportar o ocurrió un error.',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#1e3a6a',
          customClass: {
            popup: 'custom-popup',
            title: 'custom-title',
            confirmButton: 'custom-confirm-btn'
          }
        });
      }
    });
  }

  openRescheduleModal(appt: Appointment): void {
    this.selectedAppointment = appt;
    this.newRescheduleDate = appt.appointmentDate || this.selectedDate;
    this.newRescheduleTime = '';
    this.rescheduleDoctorId = appt.doctor?.id || '';
    this.loadAvailableSlots();
    this.rescheduleModal?.nativeElement?.showModal();
  }

  closeRescheduleModal(): void {
    this.rescheduleModal?.nativeElement?.close();
  }

  onRescheduleModalClose(): void {
    this.selectedAppointment = null;
    this.newRescheduleDate = '';
    this.newRescheduleTime = '';
    this.availableSlots = [];
    this.rescheduleDoctorId = '';
    this.touchedRescheduleDate = false;
    this.touchedRescheduleTime = false;
  }

  onDialogClick(event: MouseEvent, dialog: HTMLDialogElement): void {
    if (event.target === dialog) {
      dialog.close();
    }
  }

  loadAvailableSlots(): void {
    const doctorId = this.rescheduleDoctorId;
    if (!doctorId || !this.newRescheduleDate) return;

    this.isLoadingSlots = true;
    this.appointmentService.getAvailableSlots(doctorId, this.newRescheduleDate).subscribe({
      next: (slots) => {
        this.availableSlots = slots;
        this.isLoadingSlots = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading slots:', err);
        this.availableSlots = [];
        this.isLoadingSlots = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectSlot(slot: string): void {
    this.newRescheduleTime = slot;
    this.cdr.detectChanges();
  }

  confirmReschedule(): void {
    if (!this.selectedAppointment || !this.newRescheduleDate || !this.newRescheduleTime) return;

    const appointment = this.selectedAppointment;
    const date = this.newRescheduleDate;
    const time = this.newRescheduleTime;
    const doctorId = this.rescheduleDoctorId;

    this.closeRescheduleModal();

    Swal.fire({
      title: 'Confirmar Reagendamiento',
      text: `¿Estás seguro de reagendar la cita para el ${date} a las ${time}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, reagendar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3e7ba6',
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.appointmentService.rescheduleAppointment(
          appointment.id,
          date,
          time,
          doctorId
        ).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: '¡Éxito!',
              text: 'La cita ha sido reagendada.',
            });
            if (this.viewMode === 'all') {
              this.loadAllAppointments();
            } else {
              this.loadAppointments();
            }
          },
          error: (err) => {
            console.error('Error rescheduling:', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo reagendar la cita. Es posible que el horario ya no esté disponible.',
            });
          }
        });
      } else {
        this.openRescheduleModal(appointment);
      }
    });
  }
}
