import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AppointmentService, Appointment } from '../../services/appointment.service';
import { DoctorService } from '../../services/doctor.service';
import Swal from 'sweetalert2';

interface HistoryDisplay {
  id: string;
  patientName: string;
  document: string;
  date: string;
  time: string;
  status: string;
  monthStr: string;
  dayStr: string;
  observation?: string;
}

@Component({
  selector: 'app-doctor-history',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './doctor-history.component.html',
  styleUrls: ['./doctor-history.component.css']
})
export class DoctorHistoryComponent implements OnInit {
  @Output() navigate = new EventEmitter<any>();
  doctorName: string = "Cargando...";
  specialization: string = "Médico";
  doctorId: string = '';
  
  appointments: HistoryDisplay[] = [];
  filteredAppointments: HistoryDisplay[] = [];
  isLoading: boolean = true;
  searchTerm: string = '';

  // Stats
  totalCount: number = 0;
  completedCount: number = 0;
  cancelledCount: number = 0;
  noShowCount: number = 0;

  constructor(
    private authService: AuthService,
    private appointmentService: AppointmentService,
    private doctorService: DoctorService
  ) {}

  ngOnInit() {
    const user = this.authService.user();
    if (user) {
      this.doctorName = `${user.firstName} ${user.lastName}`;
      
      const cachedHistory = localStorage.getItem('cached_history_data');
      if (cachedHistory) {
          this.appointments = JSON.parse(cachedHistory);
          this.calculateStats();
          this.filterAppointments();
          this.isLoading = false;
      }
      
      const cachedDoctorId = localStorage.getItem('current_doctor_id');
      if (cachedDoctorId) {
          this.doctorId = cachedDoctorId;
          this.loadHistory();
      }

      this.doctorService.getDoctors().subscribe({
        next: (doctors) => {
          const matchedDoctor = doctors.find(d => 
            d.name.toLowerCase().includes(user.firstName.toLowerCase()) || 
            d.name.toLowerCase().includes(user.lastName.toLowerCase())
          );
          
          if (matchedDoctor) {
            this.doctorId = matchedDoctor.id;
            this.specialization = matchedDoctor.specialty || "Médico Especialista";
          } else if (doctors.length > 0) {
            this.doctorId = doctors[0].id;
            this.specialization = doctors[0].specialty || "Médico Especialista";
          }
          
          localStorage.setItem('current_doctor_id', this.doctorId);
          if (!cachedDoctorId) {
              this.loadHistory();
          }
        },
        error: (err) => {
          console.error('Error al cargar la info del doctor:', err);
          if (!cachedHistory) this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  loadHistory() {
    this.appointmentService.getAllAppointments().subscribe({
      next: (appointments) => {
        // Filtrar citas del doctor actual y que estén en el pasado o completadas/canceladas
        const now = new Date();
        const historyApts = appointments.filter(a => {
            if (a.doctor?.id !== this.doctorId) return false;
            
            // Consider as history if it's explicitly completed/cancelled or date is past
            if (a.status === 'completada' || a.status === 'cancelada') return true;
            
            const aptDate = new Date(`${a.appointmentDate}T${a.appointmentTime || a.time}`);
            return aptDate < now;
        });
        
        // Ordenar de más reciente a más antiguo
        historyApts.sort((a, b) => {
            const dateA = new Date(`${a.appointmentDate}T${a.appointmentTime || a.time}`).getTime();
            const dateB = new Date(`${b.appointmentDate}T${b.appointmentTime || b.time}`).getTime();
            return dateB - dateA; // Descending
        });
        
        this.appointments = historyApts.map(a => {
            const actualDate = a.appointmentDate || a.date;
            const actualTime = a.appointmentTime || a.time;
            const dateObj = new Date(`${actualDate}T00:00:00`);
            const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
            
            return {
                id: a.id,
                patientName: `${a.patient.firstName} ${a.patient.lastName}`,
                document: a.patient.document,
                date: actualDate,
                time: actualTime,
                status: a.status === 'agendada' && new Date(`${actualDate}T${actualTime}`) < now ? 'No asistió' : a.status,
                monthStr: !isNaN(dateObj.getMonth()) ? monthNames[dateObj.getMonth()] : '---',
                dayStr: !isNaN(dateObj.getDate()) ? dateObj.getDate().toString().padStart(2, '0') : '--',
                observation: a.observations || 'Sin observaciones registradas.'
            };
        });
        
        localStorage.setItem('cached_history_data', JSON.stringify(this.appointments));
        
        this.calculateStats();
        this.filterAppointments();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar historial:', err);
        if (this.appointments.length === 0) this.isLoading = false;
        this.showErrorModal('error', 'Error al cargar el historial de citas.');
      }
    });
  }

  calculateStats() {
      this.totalCount = this.appointments.length;
      this.completedCount = this.appointments.filter(a => a.status.toLowerCase() === 'completada').length;
      this.cancelledCount = this.appointments.filter(a => a.status.toLowerCase() === 'cancelada').length;
      this.noShowCount = this.appointments.filter(a => a.status.toLowerCase() === 'no asistió').length;
  }

  filterAppointments() {
      if (!this.searchTerm.trim()) {
          this.filteredAppointments = [...this.appointments];
          return;
      }
      const term = this.searchTerm.toLowerCase();
      this.filteredAppointments = this.appointments.filter(a => 
          a.patientName.toLowerCase().includes(term) || 
          a.document.includes(term) ||
          a.status.toLowerCase().includes(term)
      );
  }

  onSearchChange() {
      this.filterAppointments();
  }

  exportCSV(): void {
    if (!this.filteredAppointments.length) {
        Swal.fire({
            icon: 'info',
            title: 'Sin datos para exportar',
            text: 'No hay registros en el historial para exportar.',
            customClass: {
                popup: 'custom-popup',
                title: 'custom-title',
                confirmButton: 'custom-confirm-btn'
            },
            confirmButtonText: 'Entendido'
        });
        return;
    }
    
    
    // Generar CSV 
    let csvContent = "sep=;\r\nFecha;Hora;Paciente;Documento;Estado\r\n";
    this.filteredAppointments.forEach(a => {
        const cleanName = a.patientName ? a.patientName.replace(/"/g, '""') : '';
        csvContent += `${a.date};${a.time};"${cleanName}";${a.document};${a.status}\r\n`;
    });
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "historial_citas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    Swal.fire({
        icon: 'success',
        title: 'Exportación exitosa',
        text: 'El archivo CSV se ha descargado correctamente.',
        customClass: {
            popup: 'custom-popup',
            title: 'custom-title',
            confirmButton: 'custom-success-btn'
        },
        confirmButtonText: 'Aceptar',
        showConfirmButton: true,
        timer: undefined,
        timerProgressBar: false
    });
  }

  private showErrorModal(title: string, message: string): void {
      Swal.fire({
          icon: 'error',
          title: title,
          text: message,
          customClass: {
              popup: 'custom-popup',
              title: 'custom-title',
              confirmButton: 'custom-confirm-btn'
          },
          confirmButtonText: 'Entendido'
      });
  }

  getStatusClass(status: string): string {
      switch (status.toLowerCase()) {
          case 'confirmada': 
          case 'completada': return 'status-completed';
          case 'agendada': return 'status-pending';
          case 'cancelada': return 'status-cancelled';
          case 'no asistió': return 'status-noshow';
          default: return 'status-default';
      }
  }

  logout() {
    this.authService.logout();
    window.location.href = '/login';
  }
}