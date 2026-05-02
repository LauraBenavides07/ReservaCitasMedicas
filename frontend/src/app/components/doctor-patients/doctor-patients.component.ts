import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AppointmentService, Appointment } from '../../services/appointment.service';
import { DoctorService } from '../../services/doctor.service';

interface PatientDisplay {
  document: string;
  firstName: string;
  lastName: string;
  phone: string;
  lastVisit?: string;
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
  imports: [CommonModule, RouterModule, FormsModule],
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
  isEditingModalOpen: boolean = false;
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
        
        // Extraer pacientes únicos
        const patientMap = new Map<string, PatientDisplay>();
        
        doctorApts.forEach(apt => {
          const doc = apt.patient.document;
          if (!patientMap.has(doc)) {
            patientMap.set(doc, {
              document: apt.patient.document,
              firstName: apt.patient.firstName,
              lastName: apt.patient.lastName,
              phone: apt.patient.phone,
              totalVisits: 0,
              avatarColor: '',
              diagnosis: localStorage.getItem(`diagnosis_${doc}`) || 'Evaluado en la última visita',
              observation: localStorage.getItem(`observation_${doc}`) || 'Paciente atendido satisfactoriamente. (Generado automáticamente)',
              isEditingDiagnosis: false,
              isEditingObservation: false,
              hasConfirmedAppointment: false
            });
          }
          
          const p = patientMap.get(doc)!;
          p.totalVisits += 1;
          
          if (apt.status === 'confirmada') {
              p.hasConfirmedAppointment = true;
          }
          
          // Actualizar última visita si esta cita es más reciente y ya pasó/completó
          if (apt.status === 'completada' || apt.status === 'Confirmada') {
            if (!p.lastVisit || new Date(apt.appointmentDate!) > new Date(p.lastVisit)) {
              p.lastVisit = apt.appointmentDate;
            }
          }
        });
        
        this.patients = Array.from(patientMap.values()).map((p, index) => {
            p.avatarColor = this.colors[index % this.colors.length];
            return p;
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
      this.isEditingModalOpen = true;
  }

  closeModal() {
      this.isEditingModalOpen = false;
      this.editingPatient = null;
  }

  saveModalData() {
      if (this.editingPatient) {
          this.editingPatient.diagnosis = this.tempDiagnosis;
          this.editingPatient.observation = this.tempObservation;
          localStorage.setItem(`diagnosis_${this.editingPatient.document}`, this.tempDiagnosis);
          localStorage.setItem(`observation_${this.editingPatient.document}`, this.tempObservation);
          localStorage.setItem('cached_patients_data', JSON.stringify(this.patients));
      }
      this.closeModal();
  }

  logout() {
    this.authService.logout();
    window.location.href = '/login';
  }
}
