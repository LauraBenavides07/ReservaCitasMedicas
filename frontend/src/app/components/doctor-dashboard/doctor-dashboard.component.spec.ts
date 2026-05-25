import { vi, describe, it, expect, beforeEach, beforeAll, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { DoctorDashboardComponent } from './doctor-dashboard.component';
import { AppointmentService } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';
import { DoctorService } from '../../services/doctor.service';

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true, isDenied: false, isDismissed: false }),
    close: vi.fn(),
    showLoading: vi.fn()
  }
}));

describe('DoctorDashboardComponent', () => {
  let component: DoctorDashboardComponent;
  let fixture: ComponentFixture<DoctorDashboardComponent>;
  let appointmentService: AppointmentService;
  let authService: any;
  let doctorService: DoctorService;

  const mockUser = { firstName: 'Carlos', lastName: 'Médina', role: 'doctor' as const };
  const mockDoctorId = 'doc1';

  const mockDoctors = [
    { id: 'doc1', name: 'Carlos Médina', specialty: 'Cardiología', scheduleStart: '08:00', scheduleEnd: '17:00', slotDuration: 30, activeDays: [1, 2, 3, 4, 5] },
    { id: 'doc2', name: 'Dra. López', specialty: 'Pediatría', scheduleStart: '09:00', scheduleEnd: '16:00', slotDuration: 20, activeDays: [1, 3, 5] }
  ];

  const mockAppointmentResponse = {
    appointments: [
      { id: 'apt1', appointmentTime: '09:00', time: '09:00', date: '2024-01-15', appointmentDate: '2024-01-15', status: 'confirmada', patient: { firstName: 'Juan', lastName: 'Pérez', document: '12345', phone: '987654321' } },
      { id: 'apt2', appointmentTime: '10:00', time: '10:00', date: '2024-01-15', appointmentDate: '2024-01-15', status: 'agendada', patient: { firstName: 'Ana', lastName: 'García', document: '67890', phone: '123456789' } },
      { id: 'apt3', appointmentTime: '11:00', time: '11:00', date: '2024-01-15', appointmentDate: '2024-01-15', status: 'completada', patient: { firstName: 'Luis', lastName: 'Martínez', document: '11111', phone: '555555555' } },
      { id: 'apt4', appointmentTime: '12:00', time: '12:00', date: '2024-01-15', appointmentDate: '2024-01-15', status: 'cancelada', patient: { firstName: 'Sofía', lastName: 'Ramírez', document: '22222', phone: '666666666' } }
    ],
    total: 4
  };

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
    const authServiceMock = {
      user: vi.fn().mockReturnValue(mockUser),
      logout: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, DoctorDashboardComponent],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DoctorDashboardComponent);
    component = fixture.componentInstance;
    appointmentService = TestBed.inject(AppointmentService);
    authService = TestBed.inject(AuthService) as any;
    doctorService = TestBed.inject(DoctorService);

    const mockDialog = {
      showModal: vi.fn(),
      close: vi.fn()
    } as unknown as HTMLDialogElement;
    component.completionModal = {
      nativeElement: mockDialog
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set doctorName from user and load cached data if available', () => {
      const cachedAppointments = JSON.stringify([
        { id: 'apt1', patientName: 'Juan Pérez', cc: '12345', phone: '987654321', time: '09:00', status: 'Confirmada', reason: 'Consulta médica' }
      ]);
      localStorage.setItem('cached_dashboard_all', cachedAppointments);
      localStorage.setItem('current_doctor_id', mockDoctorId);

      vi.spyOn(doctorService, 'getDoctors').mockReturnValue(of(mockDoctors));
      vi.spyOn(appointmentService, 'getAppointments').mockReturnValue(of(mockAppointmentResponse));

      component.ngOnInit();

      expect(component.doctorName).toBe('Carlos Médina');
      expect(component.appointments.length).toBe(4);
      expect(component.totalAppointments).toBe(4);
      expect(appointmentService.getAppointments).toHaveBeenCalledWith('doc1', '');
    });

    it('should fetch doctorId from doctorService when no cached doctorId', () => {
      vi.spyOn(doctorService, 'getDoctors').mockReturnValue(of(mockDoctors));
      vi.spyOn(appointmentService, 'getAppointments').mockReturnValue(of(mockAppointmentResponse));

      component.ngOnInit();

      expect(doctorService.getDoctors).toHaveBeenCalled();
      expect(component.doctorId).toBe('doc1');
      expect(component.specialization).toBe('Cardiología');
      expect(localStorage.getItem('current_doctor_id')).toBe('doc1');
      expect(appointmentService.getAppointments).toHaveBeenCalled();
    });

    it('should fallback to first doctor if no name match', () => {
      const userNoMatch = { firstName: 'Nobody', lastName: 'Unknown', role: 'doctor' as const };
      authService.user.mockReturnValue(userNoMatch);
      vi.spyOn(doctorService, 'getDoctors').mockReturnValue(of(mockDoctors));
      vi.spyOn(appointmentService, 'getAppointments').mockReturnValue(of(mockAppointmentResponse));

      component.ngOnInit();

      expect(component.doctorId).toBe('doc1');
      expect(component.specialization).toBe('Cardiología');
    });

    it('should handle doctors fetch error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(doctorService, 'getDoctors').mockReturnValue(throwError(() => new Error('Network error')));

      component.ngOnInit();

      expect(consoleSpy).toHaveBeenCalledWith('Error al cargar la info del doctor:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should do nothing if no user', () => {
      authService.user.mockReturnValue(null);
      const doctorSpy = vi.spyOn(doctorService, 'getDoctors');

      component.ngOnInit();

      expect(component.doctorName).toBe('Cargando...');
      expect(doctorSpy).not.toHaveBeenCalled();
    });
  });

  describe('loadAppointments', () => {
    it('should load appointments and map them correctly', () => {
      component.doctorId = mockDoctorId;
      component.selectedDate = '';
      vi.spyOn(appointmentService, 'getAppointments').mockReturnValue(of(mockAppointmentResponse));

      component.loadAppointments();

      expect(appointmentService.getAppointments).toHaveBeenCalledWith(mockDoctorId, '');
      expect(component.appointments.length).toBe(4);
      expect(component.appointments[0].patientName).toBe('Juan Pérez');
      expect(component.appointments[0].cc).toBe('12345');
      expect(component.appointments[0].time).toBe('09:00');
      expect(component.appointments[0].status).toBe('Confirmada');
      expect(component.totalAppointments).toBe(4);
      expect(component.confirmedCount).toBe(1);
      expect(component.pendingCount).toBe(1);
      expect(component.completedCount).toBe(1);
    });

    it('should cache loaded appointments', () => {
      component.doctorId = mockDoctorId;
      component.selectedDate = '';
      vi.spyOn(appointmentService, 'getAppointments').mockReturnValue(of(mockAppointmentResponse));

      component.loadAppointments();

      const cached = localStorage.getItem('cached_dashboard_all');
      expect(cached).toBeTruthy();
      const parsed = JSON.parse(cached!);
      expect(parsed.length).toBe(4);
    });

    it('should return early if no doctorId', () => {
      component.doctorId = '';
      const spy = vi.spyOn(appointmentService, 'getAppointments');

      component.loadAppointments();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should handle error and show error modal', async () => {
      component.doctorId = mockDoctorId;
      vi.spyOn(appointmentService, 'getAppointments').mockReturnValue(throwError(() => new Error('API Error')));
      const Swal = (await import('sweetalert2')).default as any;

      component.loadAppointments();

      expect(component.appointments).toEqual([]);
      expect(component.totalAppointments).toBe(0);
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'error',
          title: 'Error al cargar citas'
        })
      );
    });
  });

  describe('onDateChange / onSearchByDate / updateDisplayDate', () => {
    it('should update selectedDate and call loadAppointments', () => {
      vi.spyOn(component, 'loadAppointments').mockImplementation(() => {});
      vi.spyOn(appointmentService, 'getAppointments').mockReturnValue(of(mockAppointmentResponse));

      component.onDateChange('2024-01-15');

      expect(component.selectedDate).toBe('2024-01-15');
      expect(component.loadAppointments).toHaveBeenCalled();
    });

    it('should format displayDate correctly with a date', () => {
      component.onSearchByDate();
      expect(component.displayDate).toBe('Todas las citas');
    });

    it('should format displayDate when date is selected', () => {
      component.selectedDate = '2024-01-15';
      component.onSearchByDate();
      expect(component.displayDate).toContain('2024');
      expect(component.displayDate).toContain('enero');
    });

    it('updateDisplayDate with null sets Todas las citas', () => {
      component.updateDisplayDate(null);
      expect(component.displayDate).toBe('Todas las citas');
    });

    it('updateDisplayDate with valid date formats string', () => {
      component.updateDisplayDate(new Date(2024, 0, 15));
      expect(component.displayDate).toContain('2024');
    });
  });

  describe('mapStatus', () => {
    it('should map statuses correctly', () => {
      expect(component.mapStatus('agendada')).toBe('Pendiente');
      expect(component.mapStatus('confirmada')).toBe('Confirmada');
      expect(component.mapStatus('completada')).toBe('Completada');
      expect(component.mapStatus('cancelada')).toBe('Cancelada');
      expect(component.mapStatus('unknown')).toBe('Pendiente');
      expect(component.mapStatus('AGENDADA')).toBe('Pendiente');
    });
  });

  describe('calculateStats', () => {
    it('should calculate stats correctly', () => {
      component.appointments = [
        { id: '1', patientName: 'A', cc: '1', phone: '1', date: '2024-01-15', time: '09:00', status: 'Confirmada', reason: 'Consulta' },
        { id: '2', patientName: 'B', cc: '2', phone: '2', date: '2024-01-15', time: '10:00', status: 'Pendiente', reason: 'Consulta' },
        { id: '3', patientName: 'C', cc: '3', phone: '3', date: '2024-01-15', time: '11:00', status: 'Completada', reason: 'Consulta' },
        { id: '4', patientName: 'D', cc: '4', phone: '4', date: '2024-01-15', time: '12:00', status: 'Cancelada', reason: 'Consulta' }
      ];

      component.calculateStats();

      expect(component.totalAppointments).toBe(4);
      expect(component.confirmedCount).toBe(1);
      expect(component.pendingCount).toBe(1);
      expect(component.completedCount).toBe(1);
    });
  });

  describe('exportToCSV', () => {
    it('should show warning if no date selected', async () => {
      const Swal = (await import('sweetalert2')).default as any;
      component.selectedDate = '';
      component.appointments = [{ id: '1', patientName: 'A', cc: '1', phone: '1', date: '2024-01-15', time: '09:00', status: 'Confirmada', reason: 'Consulta médica' }];

      component.exportToCSV();

      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ icon: 'warning', title: 'Fecha requerida' })
      );
    });

    it('should show info if no appointments', async () => {
      const Swal = (await import('sweetalert2')).default as any;
      component.selectedDate = '2024-01-15';
      component.appointments = [];

      component.exportToCSV();

      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ icon: 'info', title: 'Sin datos para exportar' })
      );
    });

    it('should export CSV successfully', () => {
      component.selectedDate = '2024-01-15';
      component.doctorId = mockDoctorId;
      component.appointments = [{ id: '1', patientName: 'Juan Pérez', cc: '12345', phone: '987654321', date: '2024-01-15', time: '09:00', status: 'Confirmada', reason: 'Consulta médica' }];

      const mockBlob = new Blob(['csv'], { type: 'text/csv' });
      vi.spyOn(appointmentService, 'exportAppointments').mockReturnValue(of(mockBlob));
      const createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:url');
      const revokeObjectURLSpy = vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        download: '',
        click: vi.fn()
      } as unknown as HTMLAnchorElement);
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);

      component.exportToCSV();

      expect(appointmentService.exportAppointments).toHaveBeenCalledWith('2024-01-15', mockDoctorId);

      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should handle export error', async () => {
      const Swal = (await import('sweetalert2')).default as any;
      component.selectedDate = '2024-01-15';
      component.doctorId = mockDoctorId;
      component.appointments = [{ id: '1', patientName: 'Juan Pérez', cc: '12345', phone: '987654321', date: '2024-01-15', time: '09:00', status: 'Confirmada', reason: 'Consulta médica' }];

      vi.spyOn(appointmentService, 'exportAppointments').mockReturnValue(throwError(() => new Error('Export error')));

      component.exportToCSV();

      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ icon: 'error', title: 'No se pudo exportar las citas' })
      );
    });
  });

  describe('confirmAppointment', () => {
    it('should call confirmAppointment service on confirmation', async () => {
      const Swal = (await import('sweetalert2')).default as any;
      const apt = { id: 'apt1', patientName: 'Juan Pérez', cc: '12345', phone: '987654321', date: '2024-01-15', time: '09:00', status: 'Pendiente', reason: 'Consulta' };
      component.appointments = [apt];
      vi.spyOn(appointmentService, 'confirmAppointment').mockReturnValue(of({}));

      await component.confirmAppointment(apt);

      expect(appointmentService.confirmAppointment).toHaveBeenCalledWith('apt1');
      expect(apt.status).toBe('Confirmada');
    });

    it('should handle confirmAppointment error', async () => {
      const Swal = (await import('sweetalert2')).default as any;
      const apt = { id: 'apt1', patientName: 'Juan Pérez', cc: '12345', phone: '987654321', date: '2024-01-15', time: '09:00', status: 'Confirmada', reason: 'Consulta' };
      vi.spyOn(appointmentService, 'confirmAppointment').mockReturnValue(throwError(() => new Error('Error')));

      await component.confirmAppointment(apt);

      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ icon: 'error', title: 'Error', text: 'No se pudo confirmar la cita' })
      );
    });
  });

  describe('cancelAppointment', () => {
    it('should call cancelAppointment service on confirmation', async () => {
      const Swal = (await import('sweetalert2')).default as any;
      const apt = { id: 'apt1', patientName: 'Juan Pérez', cc: '12345', phone: '987654321', date: '2024-01-15', time: '09:00', status: 'Confirmada', reason: 'Consulta' };
      component.appointments = [apt];
      vi.spyOn(appointmentService, 'cancelAppointment').mockReturnValue(of({}));

      await component.cancelAppointment(apt);

      expect(appointmentService.cancelAppointment).toHaveBeenCalledWith('apt1');
      expect(apt.status).toBe('Cancelada');
    });

    it('should do nothing if user cancels', async () => {
      const Swal = (await import('sweetalert2')).default as any;
      Swal.fire.mockResolvedValueOnce({ isConfirmed: false, isDenied: false, isDismissed: true });
      const apt = { id: 'apt1', patientName: 'Juan Pérez', cc: '12345', phone: '987654321', date: '2024-01-15', time: '09:00', status: 'Confirmada', reason: 'Consulta' };
      const cancelSpy = vi.spyOn(appointmentService, 'cancelAppointment');

      await component.cancelAppointment(apt);

      expect(cancelSpy).not.toHaveBeenCalled();
    });

    it('should handle cancelAppointment error', async () => {
      const Swal = (await import('sweetalert2')).default as any;
      const apt = { id: 'apt1', patientName: 'Juan Pérez', cc: '12345', phone: '987654321', date: '2024-01-15', time: '09:00', status: 'Confirmada', reason: 'Consulta' };
      vi.spyOn(appointmentService, 'cancelAppointment').mockReturnValue(throwError(() => new Error('Error')));

      await component.cancelAppointment(apt);

      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ icon: 'error', title: 'Error', text: 'No se pudo cancelar la cita' })
      );
    });
  });

  describe('completeAppointment', () => {
    it('should open the completion modal when completeAppointment is called', () => {
      const apt = { id: 'apt1', patientName: 'Juan Pérez', cc: '12345', phone: '987654321', date: '2024-01-15', time: '09:00', status: 'Confirmada', reason: 'Consulta' };
      component.doctorId = mockDoctorId;

      component.completeAppointment(apt);

      expect(component.selectedAppointment).toBe(apt);
      expect(component.completionModal.nativeElement.showModal).toHaveBeenCalled();
      expect(component.appointmentObservations).toBe('');
      expect(component.appointmentDiagnosis).toBe('');
      expect(component.rescheduleDoctorId).toBe(mockDoctorId);
    });



    it('should show an error modal when confirmCompletion fails', async () => {
      const Swal = (await import('sweetalert2')).default as any;
      const apt = { id: 'apt1', patientName: 'Juan Pérez', cc: '12345', phone: '987654321', date: '2024-01-15', time: '09:00', status: 'Confirmada', reason: 'Consulta' };
      component.selectedAppointment = apt;
      vi.spyOn(appointmentService, 'completeAppointment').mockReturnValue(throwError(() => new Error('Error')));

      await component.confirmCompletion();

      expect(apt.status).toBe('Confirmada');
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ icon: 'error', title: 'Error' })
      );
    });
  });

  describe('logout', () => {
    it('should call authService.logout and redirect', () => {
      component.logout();

      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('getStatusClass', () => {
    it('should return correct classes', () => {
      expect(component.getStatusClass('Confirmada')).toBe('status-confirmed');
      expect(component.getStatusClass('Pendiente')).toBe('status-pending');
      expect(component.getStatusClass('Completada')).toBe('status-completed');
      expect(component.getStatusClass('Cancelada')).toBe('status-cancelled');
    });
  });
});
