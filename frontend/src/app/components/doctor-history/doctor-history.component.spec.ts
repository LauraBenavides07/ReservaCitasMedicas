import { vi, describe, it, expect, beforeEach, beforeAll, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { DoctorHistoryComponent } from './doctor-history.component';
import { AppointmentService, Appointment } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';
import { DoctorService } from '../../services/doctor.service';

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true, isDenied: false, isDismissed: false })
  , close: vi.fn(), showLoading: vi.fn() }
}));

describe('DoctorHistoryComponent', () => {
  let component: DoctorHistoryComponent;
  let fixture: ComponentFixture<DoctorHistoryComponent>;
  let appointmentService: AppointmentService;
  let authService: any;
  let doctorService: DoctorService;

  const mockUser = { firstName: 'Carlos', lastName: 'Médina', role: 'doctor' as const };
  const mockDoctorId = 'doc1';

  const mockDoctors = [
    { id: 'doc1', name: 'Carlos Médina', specialty: 'Cardiología', scheduleStart: '08:00', scheduleEnd: '17:00', slotDuration: 30, activeDays: [1, 2, 3, 4, 5] },
    { id: 'doc2', name: 'Dra. López', specialty: 'Pediatría', scheduleStart: '09:00', scheduleEnd: '16:00', slotDuration: 20, activeDays: [1, 3, 5] }
  ];

  const mockAllAppointments: Appointment[] = [
    { id: 'apt1', appointmentDate: '2024-12-01', appointmentTime: '09:00', time: '09:00', date: '2024-12-01', status: 'completada', patient: { firstName: 'Juan', lastName: 'Pérez', document: '12345', phone: '987654321' }, doctor: { id: 'doc1', name: 'Carlos Médina', specialty: 'Cardiología', scheduleStart: '08:00', scheduleEnd: '17:00', slotDuration: 30, activeDays: [1, 2, 3, 4, 5] } },
    { id: 'apt2', appointmentDate: '2024-11-15', appointmentTime: '10:00', time: '10:00', date: '2024-11-15', status: 'cancelada', patient: { firstName: 'Ana', lastName: 'García', document: '67890', phone: '123456789' }, doctor: { id: 'doc1', name: 'Carlos Médina', specialty: 'Cardiología', scheduleStart: '08:00', scheduleEnd: '17:00', slotDuration: 30, activeDays: [1, 2, 3, 4, 5] } },
    { id: 'apt3', appointmentDate: '2024-10-10', appointmentTime: '11:00', time: '11:00', date: '2024-10-10', status: 'completada', patient: { firstName: 'Luis', lastName: 'Martínez', document: '11111', phone: '555555555' }, doctor: { id: 'doc2', name: 'Dra. López', specialty: 'Pediatría', scheduleStart: '09:00', scheduleEnd: '16:00', slotDuration: 20, activeDays: [1, 3, 5] } },
    { id: 'apt4', appointmentDate: '2024-12-20', appointmentTime: '08:00', time: '08:00', date: '2024-12-20', status: 'agendada', patient: { firstName: 'Sofía', lastName: 'Ramírez', document: '22222', phone: '666666666' }, doctor: { id: 'doc1', name: 'Carlos Médina', specialty: 'Cardiología', scheduleStart: '08:00', scheduleEnd: '17:00', slotDuration: 30, activeDays: [1, 2, 3, 4, 5] } }
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
      imports: [HttpClientTestingModule, DoctorHistoryComponent],
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

    fixture = TestBed.createComponent(DoctorHistoryComponent);
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
    it('should set doctorName and load cached history if available', () => {
      const cachedHistory = JSON.stringify([
        { id: 'apt1', patientName: 'Juan Pérez', document: '12345', date: '2024-12-01', time: '09:00', status: 'completada', monthStr: 'DIC', dayStr: '01' }
      ]);
      localStorage.setItem('cached_history_data', cachedHistory);
      localStorage.setItem('current_doctor_id', mockDoctorId);

      vi.spyOn(doctorService, 'getDoctors').mockReturnValue(of(mockDoctors));
      vi.spyOn(appointmentService, 'getAllAppointments').mockReturnValue(of(mockAllAppointments));

      component.ngOnInit();

      expect(component.doctorName).toBe('Carlos Médina');
      expect(component.appointments.length).toBe(3);
      expect(component.totalCount).toBe(3);
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

  describe('loadHistory', () => {
    it('should load, filter by doctor, sort desc, and map appointments', () => {
      component.doctorId = mockDoctorId;
      vi.spyOn(appointmentService, 'getAllAppointments').mockReturnValue(of(mockAllAppointments));

      component.loadHistory();

      expect(appointmentService.getAllAppointments).toHaveBeenCalled();
      // Only doc1 appointments (apt3 belongs to doc2, so excluded)
      // apt4 is 'agendada' with past date, so included as 'No asistió'
      expect(component.appointments.length).toBe(3);
      expect(component.appointments[0].patientName).toBe('Sofía Ramírez');
      expect(component.appointments[1].patientName).toBe('Juan Pérez');
      expect(component.appointments[2].patientName).toBe('Ana García');
      // Sorted desc by date: Dec 20 > Dec 1 > Nov 15
      expect(component.appointments[0].date).toBe('2024-12-20');
      expect(component.appointments[1].date).toBe('2024-12-01');
      expect(component.appointments[2].date).toBe('2024-11-15');
      expect(component.isLoading).toBe(false);
    });

    it('should cache loaded history', () => {
      component.doctorId = mockDoctorId;
      vi.spyOn(appointmentService, 'getAllAppointments').mockReturnValue(of(mockAllAppointments));

      component.loadHistory();

      const cached = localStorage.getItem('cached_history_data');
      expect(cached).toBeTruthy();
      const parsed = JSON.parse(cached!);
      expect(parsed.length).toBe(3);
    });

    it('should handle error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      component.doctorId = mockDoctorId;
      vi.spyOn(appointmentService, 'getAllAppointments').mockReturnValue(throwError(() => new Error('API Error')));

      component.loadHistory();

      expect(consoleSpy).toHaveBeenCalledWith('Error al cargar historial:', expect.any(Error));
      expect(component.isLoading).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('calculateStats', () => {
    it('should calculate stats correctly', () => {
      component.appointments = [
        { id: '1', patientName: 'A', document: '1', date: '2024-01-01', time: '09:00', status: 'completada', monthStr: 'ENE', dayStr: '01' },
        { id: '2', patientName: 'B', document: '2', date: '2024-01-02', time: '10:00', status: 'cancelada', monthStr: 'ENE', dayStr: '02' },
        { id: '3', patientName: 'C', document: '3', date: '2024-01-03', time: '11:00', status: 'no asistió', monthStr: 'ENE', dayStr: '03' },
        { id: '4', patientName: 'D', document: '4', date: '2024-01-04', time: '12:00', status: 'completada', monthStr: 'ENE', dayStr: '04' }
      ];

      component.calculateStats();

      expect(component.totalCount).toBe(4);
      expect(component.completedCount).toBe(2);
      expect(component.cancelledCount).toBe(1);
      expect(component.noShowCount).toBe(1);
    });
  });

  describe('filterAppointments / onSearchChange', () => {
    beforeEach(() => {
      component.appointments = [
        { id: '1', patientName: 'Juan Pérez', document: '12345', date: '2024-01-01', time: '09:00', status: 'completada', monthStr: 'ENE', dayStr: '01' },
        { id: '2', patientName: 'Ana García', document: '67890', date: '2024-01-02', time: '10:00', status: 'cancelada', monthStr: 'ENE', dayStr: '02' }
      ];
    });

    it('should return all appointments if no search term', () => {
      component.searchTerm = '';
      component.filterAppointments();
      expect(component.filteredAppointments.length).toBe(2);
    });

    it('should filter by patient name', () => {
      component.searchTerm = 'Juan';
      component.filterAppointments();
      expect(component.filteredAppointments.length).toBe(1);
      expect(component.filteredAppointments[0].patientName).toBe('Juan Pérez');
    });

    it('should filter by document', () => {
      component.searchTerm = '67890';
      component.filterAppointments();
      expect(component.filteredAppointments.length).toBe(1);
      expect(component.filteredAppointments[0].document).toBe('67890');
    });

    it('should filter by status', () => {
      component.searchTerm = 'cancelada';
      component.filterAppointments();
      expect(component.filteredAppointments.length).toBe(1);
      expect(component.filteredAppointments[0].status).toBe('cancelada');
    });

    it('should call filterAppointments onSearchChange', () => {
      const filterSpy = vi.spyOn(component, 'filterAppointments');
      component.onSearchChange();
      expect(filterSpy).toHaveBeenCalled();
    });
  });

  describe('exportCSV', () => {
    it('should show info if no filtered appointments', async () => {
      const Swal = (await import('sweetalert2')).default;
      component.filteredAppointments = [];

      component.exportCSV();

      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ icon: 'info', title: 'Sin datos para exportar' })
      );
    });

    it('should generate and download CSV', () => {
      component.filteredAppointments = [
        { id: '1', patientName: 'Juan Pérez', document: '12345', date: '2024-01-01', time: '09:00', status: 'completada', monthStr: 'ENE', dayStr: '01' }
      ];

      const createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:url');
      const revokeObjectURLSpy = vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});
      const originalCreateElement = document.createElement.bind(document);
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string, options?: ElementCreationOptions) => {
        if (tagName.toLowerCase() === 'a') {
          const el = originalCreateElement(tagName, options);
          vi.spyOn(el, 'click').mockImplementation(() => {});
          return el;
        }
        return originalCreateElement(tagName, options);
      });

      component.exportCSV();

      expect(createObjectURLSpy).toHaveBeenCalled();

      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
      createElementSpy.mockRestore();
    });
  });

  describe('getStatusClass', () => {
    it('should return correct classes', () => {
      expect(component.getStatusClass('completada')).toBe('status-completed');
      expect(component.getStatusClass('confirmada')).toBe('status-completed');
      expect(component.getStatusClass('agendada')).toBe('status-pending');
      expect(component.getStatusClass('cancelada')).toBe('status-cancelled');
      expect(component.getStatusClass('no asistió')).toBe('status-noshow');
      expect(component.getStatusClass('unknown')).toBe('status-default');
    });
  });

  describe('logout', () => {
    it('should call authService.logout', () => {
      component.logout();
      expect(authService.logout).toHaveBeenCalled();
    });
  });
});
