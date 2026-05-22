import { vi, describe, it, expect, beforeEach, beforeAll, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { DoctorPatientsComponent } from './doctor-patients.component';
import { AppointmentService, Appointment } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';
import { DoctorService } from '../../services/doctor.service';

describe('DoctorPatientsComponent', () => {
  let component: DoctorPatientsComponent;
  let fixture: ComponentFixture<DoctorPatientsComponent>;
  let appointmentService: AppointmentService;
  let authService: any;
  let doctorService: DoctorService;

  const mockUser = { firstName: 'Carlos', lastName: 'Médina', role: 'doctor' as const };
  const mockDoctorId = 'doc1';

  const mockDoctors = [
    { id: 'doc1', name: 'Carlos Médina', specialty: 'Cardiología', scheduleStart: '08:00', scheduleEnd: '17:00', slotDuration: 30, activeDays: '1,2,3,4,5' },
    { id: 'doc2', name: 'Dra. López', specialty: 'Pediatría', scheduleStart: '09:00', scheduleEnd: '16:00', slotDuration: 20, activeDays: '1,3,5' }
  ];

  const mockAllAppointments: Appointment[] = [
    { id: 'apt1', appointmentDate: '2024-12-01', appointmentTime: '09:00', time: '09:00', date: '2024-12-01', status: 'completada', patient: { firstName: 'Juan', lastName: 'Pérez', document: '12345', phone: '987654321' }, doctor: { id: 'doc1', name: 'Carlos Médina', specialty: 'Cardiología', scheduleStart: '08:00', scheduleEnd: '17:00', slotDuration: 30, activeDays: '1,2,3,4,5' } },
    { id: 'apt2', appointmentDate: '2024-11-15', appointmentTime: '10:00', time: '10:00', date: '2024-11-15', status: 'confirmada', patient: { firstName: 'Juan', lastName: 'Pérez', document: '12345', phone: '987654321' }, doctor: { id: 'doc1', name: 'Carlos Médina', specialty: 'Cardiología', scheduleStart: '08:00', scheduleEnd: '17:00', slotDuration: 30, activeDays: '1,2,3,4,5' } },
    { id: 'apt3', appointmentDate: '2024-10-10', appointmentTime: '11:00', time: '11:00', date: '2024-10-10', status: 'completada', patient: { firstName: 'Ana', lastName: 'García', document: '67890', phone: '123456789' }, doctor: { id: 'doc1', name: 'Carlos Médina', specialty: 'Cardiología', scheduleStart: '08:00', scheduleEnd: '17:00', slotDuration: 30, activeDays: '1,2,3,4,5' } },
    { id: 'apt4', appointmentDate: '2024-09-05', appointmentTime: '08:00', time: '08:00', date: '2024-09-05', status: 'cancelada', patient: { firstName: 'Ana', lastName: 'García', document: '67890', phone: '123456789' }, doctor: { id: 'doc1', name: 'Carlos Médina', specialty: 'Cardiología', scheduleStart: '08:00', scheduleEnd: '17:00', slotDuration: 30, activeDays: '1,2,3,4,5' } },
    { id: 'apt5', appointmentDate: '2024-12-20', appointmentTime: '08:00', time: '08:00', date: '2024-12-20', status: 'agendada', patient: { firstName: 'Luis', lastName: 'Martínez', document: '11111', phone: '555555555' }, doctor: { id: 'doc2', name: 'Dra. López', specialty: 'Pediatría', scheduleStart: '09:00', scheduleEnd: '16:00', slotDuration: 20, activeDays: '1,3,5' } }
  ];

  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, DoctorPatientsComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            user: vi.fn().mockReturnValue(mockUser),
            logout: vi.fn()
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DoctorPatientsComponent);
    component = fixture.componentInstance;
    appointmentService = TestBed.inject(AppointmentService);
    authService = TestBed.inject(AuthService) as any;
    doctorService = TestBed.inject(DoctorService);
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set doctorName and load cached patients if available', () => {
      const cachedPatients = JSON.stringify([
        { document: '12345', firstName: 'Juan', lastName: 'Pérez', phone: '987654321', totalVisits: 2, avatarColor: '#f43f5e', diagnosis: 'Diagnóstico', observation: 'Observación' }
      ]);
      localStorage.setItem('cached_patients_data', cachedPatients);
      localStorage.setItem('current_doctor_id', mockDoctorId);

      vi.spyOn(doctorService, 'getDoctors').mockReturnValue(of(mockDoctors));
      vi.spyOn(appointmentService, 'getAllAppointments').mockReturnValue(of(mockAllAppointments));

      component.ngOnInit();

      expect(component.doctorName).toBe('Carlos Médina');
      expect(component.patients.length).toBe(2);
      expect(component.totalPatients).toBe(2);
      expect(component.isLoading).toBe(false);
    });

    it('should fetch doctorId from doctorService when no cached doctorId', () => {
      vi.spyOn(doctorService, 'getDoctors').mockReturnValue(of(mockDoctors));
      vi.spyOn(appointmentService, 'getAllAppointments').mockReturnValue(of([]));

      component.ngOnInit();

      expect(component.doctorId).toBe('doc1');
      expect(component.specialization).toBe('Cardiología');
    });

    it('should fallback to first doctor if no name match', () => {
      const userNoMatch = { firstName: 'Nobody', lastName: 'Unknown', role: 'doctor' as const };
      authService.user.mockReturnValue(userNoMatch);
      vi.spyOn(doctorService, 'getDoctors').mockReturnValue(of(mockDoctors));
      vi.spyOn(appointmentService, 'getAllAppointments').mockReturnValue(of([]));

      component.ngOnInit();

      expect(component.doctorId).toBe('doc1');
    });

    it('should handle doctors fetch error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(doctorService, 'getDoctors').mockReturnValue(throwError(() => new Error('Network error')));

      component.ngOnInit();

      expect(consoleSpy).toHaveBeenCalledWith('Error al cargar la info del doctor:', expect.any(Error));
      expect(component.isLoading).toBe(false);
      consoleSpy.mockRestore();
    });

    it('should do nothing if no user', () => {
      authService.user.mockReturnValue(null);
      component.ngOnInit();
      expect(component.isLoading).toBe(false);
    });
  });

  describe('loadPatients', () => {
    it('should load appointments, deduplicate patients, and set stats', () => {
      component.doctorId = mockDoctorId;
      vi.spyOn(appointmentService, 'getAllAppointments').mockReturnValue(of(mockAllAppointments));

      component.loadPatients();

      expect(appointmentService.getAllAppointments).toHaveBeenCalled();
      // 2 unique patients: Juan Pérez (2 visits) and Ana García (2 visits)
      // Luis Martínez is doc2, so excluded
      expect(component.patients.length).toBe(2);
      expect(component.patients[0].firstName).toBe('Juan');
      expect(component.patients[0].totalVisits).toBe(2);
      expect(component.patients[0].hasConfirmedAppointment).toBe(true);
      expect(component.patients[1].firstName).toBe('Ana');
      expect(component.patients[1].totalVisits).toBe(2);
      expect(component.patients[1].hasConfirmedAppointment).toBe(false);
      expect(component.isLoading).toBe(false);
    });

    it('should set lastVisit from the most recent completed/confirmed appointment', () => {
      component.doctorId = mockDoctorId;
      vi.spyOn(appointmentService, 'getAllAppointments').mockReturnValue(of(mockAllAppointments));

      component.loadPatients();

      const juan = component.patients.find(p => p.document === '12345');
      expect(juan?.lastVisit).toBe('2024-12-01');

      const ana = component.patients.find(p => p.document === '67890');
      expect(ana?.lastVisit).toBe('2024-10-10');
    });

    it('should cache loaded patients', () => {
      component.doctorId = mockDoctorId;
      vi.spyOn(appointmentService, 'getAllAppointments').mockReturnValue(of(mockAllAppointments));

      component.loadPatients();

      const cached = localStorage.getItem('cached_patients_data');
      expect(cached).toBeTruthy();
      const parsed = JSON.parse(cached!);
      expect(parsed.length).toBe(2);
    });

    it('should handle error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      component.doctorId = mockDoctorId;
      vi.spyOn(appointmentService, 'getAllAppointments').mockReturnValue(throwError(() => new Error('API Error')));

      component.loadPatients();

      expect(consoleSpy).toHaveBeenCalledWith('Error al cargar pacientes:', expect.any(Error));
      expect(component.isLoading).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('calculateStats', () => {
    it('should calculate stats based on patient count', () => {
      component.patients = [
        { document: '1', firstName: 'A', lastName: 'A', phone: '1', totalVisits: 1, avatarColor: '#f43f5e' },
        { document: '2', firstName: 'B', lastName: 'B', phone: '2', totalVisits: 2, avatarColor: '#ec4899' },
        { document: '3', firstName: 'C', lastName: 'C', phone: '3', totalVisits: 3, avatarColor: '#d946ef' },
        { document: '4', firstName: 'D', lastName: 'D', phone: '4', totalVisits: 4, avatarColor: '#8b5cf6' },
        { document: '5', firstName: 'E', lastName: 'E', phone: '5', totalVisits: 5, avatarColor: '#6366f1' }
      ];

      component.calculateStats();

      expect(component.totalPatients).toBe(5);
      expect(component.enTratamiento).toBe(2);
      expect(component.seguimiento).toBe(1);
      expect(component.estables).toBe(2);
    });
  });

  describe('filterPatients / onSearchChange', () => {
    beforeEach(() => {
      component.patients = [
        { document: '12345', firstName: 'Juan', lastName: 'Pérez', phone: '987654321', totalVisits: 2, avatarColor: '#f43f5e' },
        { document: '67890', firstName: 'Ana', lastName: 'García', phone: '999888777', totalVisits: 1, avatarColor: '#ec4899' }
      ];
    });

    it('should return all patients if no search term', () => {
      component.searchTerm = '';
      component.filterPatients();
      expect(component.filteredPatients.length).toBe(2);
    });

    it('should filter by firstName', () => {
      component.searchTerm = 'Juan';
      component.filterPatients();
      expect(component.filteredPatients.length).toBe(1);
      expect(component.filteredPatients[0].firstName).toBe('Juan');
    });

    it('should filter by lastName', () => {
      component.searchTerm = 'García';
      component.filterPatients();
      expect(component.filteredPatients.length).toBe(1);
      expect(component.filteredPatients[0].lastName).toBe('García');
    });

    it('should filter by document', () => {
      component.searchTerm = '12345';
      component.filterPatients();
      expect(component.filteredPatients.length).toBe(1);
      expect(component.filteredPatients[0].document).toBe('12345');
    });

    it('should filter by phone', () => {
      component.searchTerm = '999888777';
      component.filterPatients();
      expect(component.filteredPatients.length).toBe(1);
      expect(component.filteredPatients[0].phone).toBe('999888777');
    });

    it('should call filterPatients onSearchChange', () => {
      const filterSpy = vi.spyOn(component, 'filterPatients');
      component.onSearchChange();
      expect(filterSpy).toHaveBeenCalled();
    });
  });

  describe('getMockStatus', () => {
    it('should return status based on index modulo 3', () => {
      const s0 = component.getMockStatus(0);
      expect(s0.label).toBe('En tratamiento');
      expect(s0.class).toBe('status-treatment');

      const s1 = component.getMockStatus(1);
      expect(s1.label).toBe('Seguimiento');
      expect(s1.class).toBe('status-followup');

      const s2 = component.getMockStatus(2);
      expect(s2.label).toBe('Estable');
      expect(s2.class).toBe('status-stable');

      const s3 = component.getMockStatus(3);
      expect(s3.label).toBe('En tratamiento');
    });
  });

  describe('openEditModal / closeModal / saveModalData', () => {
    const mockPatient = { document: '12345', firstName: 'Juan', lastName: 'Pérez', phone: '987654321', totalVisits: 2, avatarColor: '#f43f5e', diagnosis: 'Hipertensión', observation: 'En tratamiento' };

    it('should open modal with patient data', () => {
      component.openEditModal(mockPatient);

      expect(component.isEditingModalOpen).toBe(true);
      expect(component.editingPatient).toBe(mockPatient);
      expect(component.tempDiagnosis).toBe('Hipertensión');
      expect(component.tempObservation).toBe('En tratamiento');
    });

    it('should close modal and clear editingPatient', () => {
      component.openEditModal(mockPatient);
      component.closeModal();

      expect(component.isEditingModalOpen).toBe(false);
      expect(component.editingPatient).toBeNull();
    });

    it('should save modal data to localStorage', () => {
      component.patients = [mockPatient];
      component.openEditModal(mockPatient);
      component.tempDiagnosis = 'Nuevo diagnóstico';
      component.tempObservation = 'Nueva observación';

      component.saveModalData();

      expect(component.editingPatient).toBeNull();
      expect(component.isEditingModalOpen).toBe(false);
      expect(mockPatient.diagnosis).toBe('Nuevo diagnóstico');
      expect(mockPatient.observation).toBe('Nueva observación');
      expect(localStorage.getItem('diagnosis_12345')).toBe('Nuevo diagnóstico');
      expect(localStorage.getItem('observation_12345')).toBe('Nueva observación');
      expect(localStorage.getItem('cached_patients_data')).toBeTruthy();
    });
  });

  describe('logout', () => {
    it('should call authService.logout and redirect', () => {
      component.logout();

      expect(authService.logout).toHaveBeenCalled();
    });
  });
});
