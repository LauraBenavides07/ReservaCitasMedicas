import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AppointmentService, Appointment } from '../../services/appointment.service';
import { DoctorService } from '../../services/doctor.service';
import { ButtonComponent } from '../../shared/atoms/button/button.component';

interface PatientDisplay {
  id: string;
  document: string;
  firstName: string;
  lastName: string;
  phone: string;
  lastVisit?: string;
  nextVisit?: string;
  totalVisits: number;
  avatarColor: string;
  diagnosis?: string;
  observation?: string;
  isEditingDiagnosis?: boolean;
  isEditingObservation?: boolean;
  hasConfirmedAppointment?: boolean;
}

@Component({
  selector: 'app-doctor-patients',
  standalone: true,
  imports: [ButtonComponent, CommonModule, RouterModule, FormsModule],
  templateUrl: './doctor-patients.component.html',
  styleUrls: ['./doctor-patients.component.css']
})
export class DoctorPatientsComponent implements OnInit {
  @Output() navigate = new EventEmitter<any>();
  doctorName: string = "Cargando...";
  specialization: string = "Médico";
  doctorId: string = '';
  
  patients: PatientDisplay[] = [];
  filteredPatients: PatientDisplay[] = [];
  isLoading: boolean = true;
  searchTerm: string = '';

  // Stats
  totalPatients: number = 0;
  enTratamiento: number = 0;
  seguimiento: number = 0;
  estables: number = 0;

  // Modal State
  @ViewChild('editModal') editModal!: ElementRef<HTMLDialogElement>;
  editingPatient: PatientDisplay | null = null;
  tempDiagnosis: string = '';
  tempObservation: string = '';

  // Avatar colors
  private colors = ['#f43f5e', '#ec4899', '#d946ef', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

  constructor(
    private authService: AuthService,
    private appointmentService: AppointmentService,
    private doctorService: DoctorService
  ) {}

  ngOnInit() {
    const user = this.authService.user();
    if (user) {
      this.doctorName = `${user.firstName} ${user.lastName}`;
      
      // Attempt to load from cache first for instant UI
      const cachedPatients = localStorage.getItem('cached_patients_data');
      if (cachedPatients) {
          this.patients = JSON.parse(cachedPatients);
          this.calculateStats();
          this.filterPatients();
          this.isLoading = false;
      }
      
      const cachedDoctorId = localStorage.getItem('current_doctor_id');
      if (cachedDoctorId) {
          this.doctorId = cachedDoctorId;
          this.loadPatients();
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
             this.loadPatients();
          }
        },
        error: (err) => {
          console.error('Error al cargar la info del doctor:', err);
          if (!cachedPatients) this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  loadPatients() {
    this.appointmentService.getAllAppointments().subscribe({
      next: (appointments) => {
        // Filtrar citas del doctor actual
        const doctorApts = appointments.filter(a => a.doctor?.id === this.doctorId);
        
        // Use all appointments to find next visit with this doctor
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const patientMap = new Map<string, PatientDisplay>();

        doctorApts.forEach(apt => {
          const doc = apt.patient.document;
          if (!patientMap.has(doc)) {
            patientMap.set(doc, {
              id: (apt.patient as any).id || '',
              document: apt.patient.document,
              firstName: apt.patient.firstName,
              lastName: apt.patient.lastName,
              phone: apt.patient.phone,
              totalVisits: 0,
              avatarColor: '',
              diagnosis: 'Sin diagnóstico previo',
              observation: 'Sin observaciones previas',
              isEditingDiagnosis: false,
              isEditingObservation: false,
              hasConfirmedAppointment: false
            });
          }
          
          const p = patientMap.get(doc)!;
          
          // Increment visits only if it's with this doctor
          if (apt.doctor?.id === this.doctorId) {
            p.totalVisits += 1;
            
            if (apt.status === 'confirmada' || apt.status === 'agendada') {
                p.hasConfirmedAppointment = true;
            }

            const aptDateValue = apt.appointmentDate || apt.date;
            
            // Proxima cita: earliest future appointment with THIS doctor
            if (apt.status === 'agendada' || apt.status === 'confirmada') {
              if (aptDateValue && aptDateValue >= todayStr) {
                if (!p.nextVisit || aptDateValue < p.nextVisit) {
                  p.nextVisit = aptDateValue;
                }
              }
            }
            
            // Last visit: latest past/completada appointment with THIS doctor
            if (apt.status === 'completada' || (apt.status === 'confirmada' && aptDateValue && aptDateValue < todayStr)) {
              if (!p.lastVisit || aptDateValue! > p.lastVisit) {
                p.lastVisit = aptDateValue;
                if (apt.diagnosis) p.diagnosis = apt.diagnosis;
                if (apt.observations) p.observation = apt.observations;
              }
            }
          }
        });
        
        this.patients = Array.from(patientMap.values());
        this.patients.forEach((p, index) => {
            p.avatarColor = this.colors[index % this.colors.length];
        });
        
        localStorage.setItem('cached_patients_data', JSON.stringify(this.patients));
        
        this.calculateStats();
        this.filterPatients();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar pacientes:', err);
        if (this.patients.length === 0) this.isLoading = false;
      }
    });
  }

  calculateStats() {
      this.totalPatients = this.patients.length;
      // Mock stats as requested by prototype since we don't have this data in backend
      this.enTratamiento = Math.floor(this.totalPatients * 0.4);
      this.seguimiento = Math.floor(this.totalPatients * 0.3);
      this.estables = this.totalPatients - this.enTratamiento - this.seguimiento;
  }

  filterPatients() {
      if (!this.searchTerm.trim()) {
          this.filteredPatients = [...this.patients];
          return;
      }
      const term = this.searchTerm.toLowerCase();
      this.filteredPatients = this.patients.filter(p => 
          p.firstName.toLowerCase().includes(term) || 
          p.lastName.toLowerCase().includes(term) ||
          p.document.includes(term) ||
          p.phone.includes(term)
      );
  }

  onSearchChange() {
      this.filterPatients();
  }

  getMockStatus(index: number): { label: string, class: string } {
      const statuses = [
          { label: 'En tratamiento', class: 'status-treatment' },
          { label: 'Seguimiento', class: 'status-followup' },
          { label: 'Estable', class: 'status-stable' }
      ];
      return statuses[index % 3];
  }

  openEditModal(patient: PatientDisplay) {
      this.editingPatient = patient;
      this.tempDiagnosis = patient.diagnosis || '';
      this.tempObservation = patient.observation || '';
      this.editModal.nativeElement.showModal();
  }

  closeModal() {
      this.editModal.nativeElement.close();
  }

  onEditModalClose() {
      this.editingPatient = null;
  }

  onDialogClick(event: MouseEvent, dialog: HTMLDialogElement): void {
    if (event.target === dialog) {
      dialog.close();
    }
  }

  saveModalData() {
      if (this.editingPatient) {
          this.editingPatient.diagnosis = this.tempDiagnosis;
          this.editingPatient.observation = this.tempObservation;

          if (this.editingPatient.id) {
            this.appointmentService.updatePatientMedicalInfo(this.editingPatient.id, {
              diagnosis: this.tempDiagnosis,
              observations: this.tempObservation
            }).subscribe({
              next: () => {
                localStorage.setItem(`diagnosis_${this.editingPatient!.document}`, this.tempDiagnosis);
                localStorage.setItem(`observation_${this.editingPatient!.document}`, this.tempObservation);
                localStorage.setItem('cached_patients_data', JSON.stringify(this.patients));
                this.closeModal();
              },
              error: () => {
                localStorage.setItem(`diagnosis_${this.editingPatient!.document}`, this.tempDiagnosis);
                localStorage.setItem(`observation_${this.editingPatient!.document}`, this.tempObservation);
                localStorage.setItem('cached_patients_data', JSON.stringify(this.patients));
                this.closeModal();
              }
            });
          } else {
            localStorage.setItem(`diagnosis_${this.editingPatient.document}`, this.tempDiagnosis);
            localStorage.setItem(`observation_${this.editingPatient.document}`, this.tempObservation);
            localStorage.setItem('cached_patients_data', JSON.stringify(this.patients));
            this.closeModal();
          }
      } else {
        this.closeModal();
      }
  }

  logout() {
    this.authService.logout();
    window.location.href = '/login';
  }
}
