import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

// Servicios y modelos
import { AppointmentService, Appointment, AppointmentResponse } from '../../services/appointment.service';
import { DoctorService, Doctor } from '../../services/doctor.service';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  // Formatea fecha (ej: 5 de mar)
  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return 'N/A';

    try {
      // Evita problemas de zona horaria
      const d = new Date(dateStr + 'T12:00:00');
      const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      return `${d.getDate()} de ${months[d.getMonth()]}`;
    } catch {
      return dateStr;
    }
  }

    // Cargar TODAS las citas
  loadAllAppointments(): void {
  this.loading = true;
  this.viewMode = 'all';  // Cambia a modo 'all'
  this.hasSearched = true;
  
  this.appointmentService.getAllAppointments()
    .pipe(finalize(() => {
      this.loading = false;
      this.cdr.detectChanges();
    }))
    .subscribe({
      next: (data) => {
        this.appointments = data;
        this.total = data.length;
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
    if (!this.selectedDoctorId || !this.selectedDate) return;

    this.appointmentService
      .exportAppointments(this.selectedDate, this.selectedDoctorId)
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `citas-${this.selectedDate}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          alert('No existen citas para exportar o hubo un error');
          console.error('Error exporting appointments:', err);
        }
      });
  }

}