import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AppointmentService, Appointment } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';
import { DoctorService } from '../../services/doctor.service';

export interface DisplayAppointment {
    id: string;
    patientName: string;
    cc: string;
    phone: string;
    time: string;
    status: 'Confirmada' | 'Pendiente' | 'Completada' | 'Cancelada' | string;
    reason: string;
}

@Component({
    selector: 'app-doctor-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    providers: [DatePipe],
    templateUrl: './doctor-dashboard.component.html',
    styleUrls: ['./doctor-dashboard.component.css']
})
export class DoctorDashboardComponent implements OnInit {
    @Output() navigate = new EventEmitter<any>();

    // Variables for the statistics cards
    totalAppointments: number = 0;
    confirmedCount: number = 0;
    pendingCount: number = 0;
    completedCount: number = 0;

    // The list of appointments to display
    appointments: DisplayAppointment[] = [];
    selectedDate: string = '';
    displayDate: string = '';

    // Doctor's info
    doctorName: string = "Cargando...";
    specialization: string = "Médico";
    doctorId: string = '';

    constructor(
        private appointmentService: AppointmentService,
        private authService: AuthService,
        private doctorService: DoctorService,
        private datePipe: DatePipe
    ) { }

    ngOnInit() {
        const user = this.authService.user();
        if (user) {
            this.doctorName = `${user.firstName} ${user.lastName}`;
            
            // Initially, do not filter by date so all load
            this.selectedDate = '';
            this.displayDate = 'Todas las citas';

            // Attempt to load from cache
            const cachedAppointments = localStorage.getItem(`cached_dashboard_all`);
            if (cachedAppointments) {
                this.appointments = JSON.parse(cachedAppointments);
                this.calculateStats();
            }

            const cachedDoctorId = localStorage.getItem('current_doctor_id');
            if (cachedDoctorId) {
                this.doctorId = cachedDoctorId;
                this.loadAppointments();
            }
            
            // Buscar el ID real del doctor en la base de datos de doctores
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
                        // Fallback al primer doctor si no hay coincidencia exacta
                        this.doctorId = doctors[0].id;
                        this.specialization = doctors[0].specialty || "Médico Especialista";
                    }
                    localStorage.setItem('current_doctor_id', this.doctorId);
                    
                    // Solo ahora cargamos las citas si no teníamos el ID cacheado
                    if (!cachedDoctorId) {
                        this.loadAppointments();
                    }
                },
                error: (err) => {
                    console.error('Error al cargar la info del doctor:', err);
                }
            });
        }
    }

    updateDisplayDate(date: Date | null) {
        if (!date) {
            this.displayDate = 'Todas las citas';
            return;
        }
        let str = date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        this.displayDate = str.charAt(0).toUpperCase() + str.slice(1);
    }

    onDateChange(newDate: string) {
        this.selectedDate = newDate;
        this.onSearchByDate();
    }

    onSearchByDate() {
        if (this.selectedDate) {
            // Ajustar zona horaria si es necesario
            const dateObj = new Date(this.selectedDate + 'T12:00:00');
            this.updateDisplayDate(dateObj);
        } else {
            this.updateDisplayDate(null);
        }
        this.loadAppointments();
    }

    loadAppointments() {
        if (!this.doctorId) return;

        this.appointmentService.getAppointments(this.doctorId, this.selectedDate).subscribe({
            next: (res) => {
                this.appointments = res.appointments.map((a: Appointment) => ({
                    id: a.id,
                    patientName: `${a.patient.firstName} ${a.patient.lastName}`,
                    cc: a.patient.document,
                    phone: a.patient.phone,
                    time: a.appointmentTime ? a.appointmentTime.substring(0, 5) : a.time,
                    status: this.mapStatus(a.status),
                    reason: 'Consulta médica'
                }));
                const cacheKey = this.selectedDate ? `cached_dashboard_${this.selectedDate}` : 'cached_dashboard_all';
                localStorage.setItem(cacheKey, JSON.stringify(this.appointments));
                this.calculateStats();
            },
            error: (err) => {
                console.error('Error al cargar citas:', err);
                this.appointments = [];
                this.calculateStats();
            }
        });
    }

    mapStatus(status: string): string {
        switch (status.toLowerCase()) {
            case 'agendada': return 'Pendiente';
            case 'confirmada': return 'Confirmada';
            case 'completada': return 'Completada';
            case 'cancelada': return 'Cancelada';
            default: return 'Pendiente';
        }
    }

    calculateStats() {
        this.totalAppointments = this.appointments.length;
        this.confirmedCount = this.appointments.filter(a => a.status === 'Confirmada').length;
        this.pendingCount = this.appointments.filter(a => a.status === 'Pendiente' || a.status === 'agendada').length;
        this.completedCount = this.appointments.filter(a => a.status === 'Completada').length;
    }

    exportToCSV() {
        if (!this.appointments.length) {
            alert("No hay citas para exportar en esta fecha.");
            return;
        }

        // Llamar al backend real para exportar
        this.appointmentService.exportAppointments(this.selectedDate, this.doctorId).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `citas_${this.selectedDate}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            },
            error: (err) => {
                console.error('Error al exportar CSV:', err);
                alert('Hubo un error al exportar las citas.');
            }
        });
    }

    logout() {
        this.authService.logout();
        window.location.href = '/login'; // Force reload to clear state and go to login
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'Confirmada': return 'status-confirmed';
            case 'Pendiente': return 'status-pending';
            case 'Completada': return 'status-completed';
            default: return 'status-default';
        }
    }

    confirmAppointment(apt: DisplayAppointment) {
        if (confirm(`¿Está seguro de que desea confirmar la cita con ${apt.patientName}?`)) {
            this.appointmentService.confirmAppointment(apt.id).subscribe({
                next: () => {
                    this.loadAppointments();
                },
                error: (err) => {
                    console.error('Error al confirmar la cita:', err);
                    alert('No se pudo confirmar la cita.');
                }
            });
        }
    }

    cancelAppointment(apt: DisplayAppointment) {
        if (confirm(`¿Está seguro de que desea cancelar la cita con ${apt.patientName}?`)) {
            this.appointmentService.cancelAppointment(apt.id).subscribe({
                next: () => {
                    this.loadAppointments();
                },
                error: (err) => {
                    console.error('Error al cancelar la cita:', err);
                    alert('No se pudo cancelar la cita.');
                }
            });
        }
    }

    completeAppointment(apt: DisplayAppointment) {
        if (confirm(`¿Está seguro de que desea marcar como completada la cita con ${apt.patientName}?`)) {
            // As there might not be a backend endpoint for this currently,
            // we manually update the UI and save to local state for the prototype.
            apt.status = 'Completada';
            this.calculateStats();
            const cacheKey = this.selectedDate ? `cached_dashboard_${this.selectedDate}` : 'cached_dashboard_all';
            localStorage.setItem(cacheKey, JSON.stringify(this.appointments));
            
            // Option to notify user
            alert('Cita marcada como completada exitosamente.');
        }
    }
}