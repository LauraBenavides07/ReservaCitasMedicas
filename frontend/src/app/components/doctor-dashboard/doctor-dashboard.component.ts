import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AppointmentService, Appointment } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';
import { DoctorService } from '../../services/doctor.service';
import Swal from 'sweetalert2';

interface HttpError {
    error?: {message?: string;};
    message?: string;
    status?: number;
}

export interface DisplayAppointment {
    id: string;
    patientName: string;
    cc: string;
    phone: string;
    date: string;
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
    
    doctors: any[] = [];
    rescheduleDoctorId: string = '';

    // Modal state for completion
    isCompletionModalOpen = false;
    selectedAppointment: DisplayAppointment | null = null;
    appointmentObservations = '';
    appointmentDiagnosis = '';
    shouldReschedule = false;

    // Rescheduling state
    rescheduleDate = '';
    rescheduleTime = '';
    availableSlots: string[] = [];
    isReschedulingLoading = false;
    touchedRescheduleDate = false;
    touchedRescheduleTime = false;

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
                    this.doctors = doctors;
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
                this.appointments = res.appointments
                    .map((a: Appointment) => ({
                        id: a.id,
                        patientName: `${a.patient.firstName} ${a.patient.lastName}`,
                        cc: a.patient.document,
                        phone: a.patient.phone,
                        date: a.appointmentDate || a.date,
                        time: a.appointmentTime ? a.appointmentTime.substring(0, 5) : a.time,
                        status: this.mapStatus(a.status),
                        reason: 'Consulta médica'
                    }))
                    .sort((a, b) => {
                        const aActive = a.status === 'Pendiente' || a.status === 'Confirmada' ? 0 : 1;
                        const bActive = b.status === 'Pendiente' || b.status === 'Confirmada' ? 0 : 1;
                        if (aActive !== bActive) return aActive - bActive;
                        return b.date?.localeCompare(a.date) || 0;
                    });
                const cacheKey = this.selectedDate ? `cached_dashboard_${this.selectedDate}` : 'cached_dashboard_all';
                localStorage.setItem(cacheKey, JSON.stringify(this.appointments));
                this.calculateStats();
            },
            error: (err) => {
                console.error('Error al cargar citas:', err);
                this.appointments = [];
                this.calculateStats();
                this.showErrorModal('Error al cargar citas', 'No se pudieron cargar las citas. Por favor, intenta nuevamente.');
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

     exportToCSV(): void {
         if (!this.selectedDate || this.selectedDate.trim() === '') {
        Swal.fire({
            icon: 'warning',
            title: 'Fecha requerida',
            text: 'Por favor, selecciona una fecha antes de exportar las citas.',
            customClass: {
                popup: 'custom-popup',
                title: 'custom-title',
                confirmButton: 'custom-confirm-btn'
            },
            confirmButtonText: 'Entendido'
        });
        return;
    }
    if (!this.appointments.length) {
        Swal.fire({
            icon: 'info',
            title: 'Sin datos para exportar',
            text: 'No hay citas programadas en el rango seleccionado.',
            customClass: {
                popup: 'custom-popup',
                title: 'custom-title',
                confirmButton: 'custom-confirm-btn'
            },
            confirmButtonText: 'Entendido'
        });
            return;
    }

     Swal.fire({
        title: 'Generando archivo...',
        text: 'Por favor espera, estamos preparando tu archivo CSV.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        },
        customClass: {
            popup: 'custom-popup',
            title: 'custom-title'
        }
    });

    this.appointmentService.exportAppointments(this.selectedDate, this.doctorId).subscribe({
        next: (blob: Blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `citas_${this.selectedDate}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
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
                timer: 8000,
                timerProgressBar: true
            });
        },
        error: (err: Error) => {
            console.error('Error al exportar CSV:', err);
            Swal.fire({
                icon: 'error',
                title: 'No se pudo exportar las citas',
                html: `
                    <div class="error-suggestions">
                        <p>Ocurrió un problema al generar el archivo.</p>
                        <p>Posibles soluciones:</p>
                        <ul>
                            <li>✓ Verifica que haya citas registradas</li>
                            <li>✓ Intenta nuevamente en unos momentos</li>
                            <li>✓ Si el problema persiste, contacta a soporte</li>
                        </ul>
                    </div>
                `,
                customClass: {
                    popup: 'custom-popup',
                    title: 'custom-title',
                    htmlContainer: 'custom-html',
                    confirmButton: 'custom-confirm-btn'
                },
                confirmButtonText: 'Entendido'
            });
        }
    });
}

    confirmAppointment(apt: DisplayAppointment): void {
        Swal.fire({
            title: 'Confirmar cita',
            html: `¿Está seguro de que desea <strong>confirmar</strong> la cita con <strong>${apt.patientName}</strong>?`,
            icon: 'question',
            showCancelButton: true,
            customClass: {
                popup: 'custom-popup',
                title: 'custom-title',
                htmlContainer: 'custom-html',
                confirmButton: 'custom-success-btn',
                cancelButton: 'custom-cancel-btn'
            },
            confirmButtonText: 'Sí, confirmar',
            cancelButtonText: 'Cancelar'
        }).then((result: any) => {
            if (result.isConfirmed) {
                this.appointmentService.confirmAppointment(apt.id).subscribe({
                    next: () => {
                        apt.status = 'Confirmada';
                        this.calculateStats();
                        Swal.fire({
                            icon: 'success',
                            title: 'Cita confirmada',
                            text: `La cita con ${apt.patientName} ha sido confirmada exitosamente.`,
                            customClass: {
                                popup: 'custom-popup',
                                title: 'custom-title',
                                confirmButton: 'custom-success-btn'
                            },
                            confirmButtonText: 'Aceptar'
                        });
                    },
                    error: (err: Error) => {
                        console.error('Error al confirmar la cita:', err);
                        Swal.fire({
                            icon: 'error',
                            title: 'No se pudo confirmar la cita',
                            text: 'Ocurrió un problema. Por favor, intenta nuevamente.',
                            customClass: {
                                popup: 'custom-popup',
                                title: 'custom-title',
                                confirmButton: 'custom-confirm-btn'
                            },
                            confirmButtonText: 'Entendido'
                        });
                    }
                });
            }
        });
    }

    cancelAppointment(apt: DisplayAppointment): void {
        Swal.fire({
            title: 'Cancelar cita',
            html: `¿Está seguro de que desea <strong>cancelar</strong> la cita con <strong>${apt.patientName}</strong>?<br><small>Esta acción no se puede revertir.</small>`,
            icon: 'warning',
            showCancelButton: true,
            customClass: {
                popup: 'custom-popup',
                title: 'custom-title',
                htmlContainer: 'custom-html',
                confirmButton: 'custom-danger-btn',
                cancelButton: 'custom-cancel-btn'
            },
            confirmButtonText: 'Sí, cancelar cita',
            cancelButtonText: 'No, mantener'
        }).then((result: any) => {
            if (result.isConfirmed) {
                this.appointmentService.cancelAppointment(apt.id).subscribe({
                    next: () => {
                        apt.status = 'Cancelada';
                        this.calculateStats();
                        Swal.fire({
                            icon: 'success',
                            title: 'Cita cancelada',
                            text: `La cita con ${apt.patientName} ha sido cancelada.`,
                            customClass: {
                                popup: 'custom-popup',
                                title: 'custom-title',
                                confirmButton: 'custom-success-btn'
                            },
                            confirmButtonText: 'Aceptar'
                        });
                    },
                    error: (err: Error) => {
                        console.error('Error al cancelar la cita:', err);
                        Swal.fire({
                            icon: 'error',
                            title: 'No se pudo cancelar la cita',
                            text: 'Ocurrió un problema. Por favor, intenta nuevamente.',
                            customClass: {
                                popup: 'custom-popup',
                                title: 'custom-title',
                                confirmButton: 'custom-confirm-btn'
                            },
                            confirmButtonText: 'Entendido'
                        });
                    }
                });
            }
        });
    }

    completeAppointment(apt: DisplayAppointment): void {
        this.selectedAppointment = apt;
        this.appointmentObservations = '';
        this.appointmentDiagnosis = '';
        this.shouldReschedule = false;
        this.rescheduleDate = '';
        this.rescheduleTime = '';
        this.rescheduleDoctorId = this.doctorId;
        this.isCompletionModalOpen = true;
    }

    closeCompletionModal(): void {
        this.isCompletionModalOpen = false;
        this.selectedAppointment = null;
    }

    onRescheduleToggle(): void {
        if (this.shouldReschedule && !this.rescheduleDate) {
            // Set default date to tomorrow if rescheduling is enabled
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            this.rescheduleDate = tomorrow.toISOString().split('T')[0];
            this.loadAvailableSlots();
        }
    }

    selectSlot(slot: string): void {
        this.rescheduleTime = slot;
    }

    getObservationsLength(): number {
        return this.appointmentObservations ? this.appointmentObservations.length : 0;
    }

    loadAvailableSlots(): void {
        const docId = this.rescheduleDoctorId || this.doctorId;
        if (!docId || !this.rescheduleDate) return;

        this.isReschedulingLoading = true;
        this.appointmentService.getAvailableSlots(docId, this.rescheduleDate).subscribe({
            next: (slots) => {
                this.availableSlots = slots;
                this.isReschedulingLoading = false;
            },
            error: (err) => {
                console.error('Error loading slots:', err);
                this.availableSlots = [];
                this.isReschedulingLoading = false;
            }
        });
    }

    confirmCompletion(): void {
        if (!this.selectedAppointment) return;

        const apt = this.selectedAppointment;
        
        // Use standard completion logic
        this.appointmentService.completeAppointment(
            apt.id, 
            this.appointmentObservations, 
            this.appointmentDiagnosis
        ).subscribe({
            next: () => {
                apt.status = 'Completada';
                this.calculateStats();
                
                if (this.shouldReschedule && this.rescheduleDate && this.rescheduleTime) {
                    this.performReschedule(apt);
                } else {
                    this.closeCompletionModal();
                    Swal.fire({
                        icon: 'success',
                        title: 'Cita completada',
                        text: `La cita con ${apt.patientName} ha sido marcada como completada.`,
                        customClass: {
                            container: 'swal-zindex-fix',
                popup: 'swal-zindex-fix'
                        },
                        confirmButtonText: 'Aceptar'
                    });
                }
            },
            error: (err: any) => {
                console.error('Error al completar la cita:', err);
                this.showErrorModal('Error', 'No se pudo completar la cita. Intente de nuevo.');
            }
        });
    }

    private performReschedule(apt: DisplayAppointment): void {
        const createDto = {
            patientDocument: apt.cc,
            firstName: apt.patientName.split(' ')[0],
            lastName: apt.patientName.split(' ').slice(1).join(' '),
            phone: apt.phone,
            gender: 'M', // Generic, would be better to have it from patient info
            doctorId: this.rescheduleDoctorId,
            date: this.rescheduleDate,
            time: this.rescheduleTime
        };

        this.appointmentService.createAppointment(createDto).subscribe({
            next: (newApt) => {
                this.closeCompletionModal();
                Swal.fire({
                    icon: 'success',
                    title: 'Cita completada y reagendada',
                    text: `La cita ha sido completada y se ha programado una nueva para el ${this.rescheduleDate} a las ${this.rescheduleTime}.`,
                    customClass: {
                        container: 'swal-zindex-fix',
                popup: 'swal-zindex-fix'
                    },
                    confirmButtonText: 'Aceptar'
                });
                this.loadAppointments(); // Refresh list to show new appointment if in current view
            },
            error: (err) => {
                console.error('Error al reagendar:', err);
                this.closeCompletionModal();
                Swal.fire({
                    icon: 'warning',
                    title: 'Cita completada, pero fallo el reagendamiento',
                    text: 'La cita se marcó como completada pero no se pudo crear la nueva cita. Por favor, intente agendarla manualmente.',
                    customClass: {
                        container: 'swal-zindex-fix',
                popup: 'swal-zindex-fix'
                    },
                    confirmButtonText: 'Aceptar'
                });
            }
        });
    }

    private showErrorModal(title: string, message: string): void {
        Swal.fire({
            icon: 'error',
            title: title,
            text: message,
            customClass: {
                container: 'swal-zindex-fix',
                popup: 'swal-zindex-fix'
            },
            confirmButtonText: 'Entendido'
        });
    }

    logout() {
        this.authService.logout();
        window.location.href = '/login';
    }

    formatDate(dateStr: string): string {
        if (!dateStr) return '';
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

    formatTime(timeStr: string): string {
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

    getStatusClass(status: string): string {
        switch (status) {
            case 'Confirmada': return 'status-confirmed';
            case 'Pendiente': return 'status-pending';
            case 'Completada': return 'status-completed';
            case 'Cancelada': return 'status-cancelled';
            default: return 'status-default';
        }
    }
}