import { vi, describe, it, expect, beforeEach, beforeAll, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { PatientDashboardComponent } from './patient-dashboard.component';
import { AppointmentService } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true, isDenied: false, isDismissed: false })
  }
}));

describe('PatientDashboardComponent', () => {
  let component: PatientDashboardComponent;
  let fixture: ComponentFixture<PatientDashboardComponent>;
  let appointmentService: AppointmentService;
  let authService: AuthService;

  const mockUser = { firstName: 'Juan', lastName: 'Pérez', role: 'patient' as const };

  const mockAppointments = [
    {
      id: 'apt1',
      appointmentDate: '2024-01-15',
      appointmentTime: '09:00',
      status: 'confirmed',
      doctor: { id: 'doc1', name: 'Dr. García' }
    },
    {
      id: 'apt2',
      appointmentDate: '2024-01-20',
      appointmentTime: '10:30',
      status: 'pending',
      doctor: { id: 'doc2', name: 'Dra. López' }
    }
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
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, PatientDashboardComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            user: vi.fn().mockReturnValue(mockUser)
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PatientDashboardComponent);
    component = fixture.componentInstance;
    appointmentService = TestBed.inject(AppointmentService);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load appointments on init', () => {
    vi.spyOn(appointmentService, 'getPatientAppointments').mockReturnValue(of(mockAppointments));

    component.ngOnInit();

    expect(appointmentService.getPatientAppointments).toHaveBeenCalled();
  });

  it('should loadAppointments: sets appointments signal, sets isLoading to false', () => {
    vi.spyOn(appointmentService, 'getPatientAppointments').mockReturnValue(of(mockAppointments));

    component.loadAppointments();

    expect(component.appointments()).toEqual(mockAppointments);
    expect(component.isLoading()).toBe(false);
  });

  it('should loadAppointments error: sets isLoading to false', () => {
    vi.spyOn(appointmentService, 'getPatientAppointments').mockReturnValue(throwError(() => new Error('Network error')));

    component.loadAppointments();

    expect(component.isLoading()).toBe(false);
  });

  it('should cancel: calls cancelAppointment on confirm, reloads appointments', async () => {
    const Swal = (await import('sweetalert2')).default;
    vi.spyOn(appointmentService, 'cancelAppointment').mockReturnValue(of({}));
    vi.spyOn(appointmentService, 'getPatientAppointments').mockReturnValue(of(mockAppointments));

    await component.cancel('apt1');

    expect(appointmentService.cancelAppointment).toHaveBeenCalledWith('apt1');
    expect(appointmentService.getPatientAppointments).toHaveBeenCalled();
  });

  it('should cancel: does nothing if user dismisses', async () => {
    const Swal = (await import('sweetalert2')).default;
    Swal.fire.mockResolvedValueOnce({ isConfirmed: false, isDenied: false, isDismissed: true });
    const cancelSpy = vi.spyOn(appointmentService, 'cancelAppointment');

    await component.cancel('apt1');

    expect(cancelSpy).not.toHaveBeenCalled();
  });

  it('should startReschedule: sets reschedulingId, calls onDateChange', () => {
    vi.spyOn(appointmentService, 'getAvailableSlots').mockReturnValue(of(['09:00', '10:00']));

    component.startReschedule(mockAppointments[0]);

    expect(component.reschedulingId()).toBe('apt1');
    expect(component.newDate).toBe('2024-01-15');
    expect(component.newTime).toBe('');
    expect(appointmentService.getAvailableSlots).toHaveBeenCalledWith('doc1', '2024-01-15');
  });

  it('should onDateChange: calls getAvailableSlots, sets availableSlots', () => {
    const slots = ['09:00', '10:00', '11:00'];
    vi.spyOn(appointmentService, 'getAvailableSlots').mockReturnValue(of(slots));

    component.newDate = '2024-01-15';
    component.onDateChange('doc1');

    expect(appointmentService.getAvailableSlots).toHaveBeenCalledWith('doc1', '2024-01-15');
    expect(component.availableSlots()).toEqual(slots);
  });

  it('should confirmReschedule: calls rescheduleAppointment with date and time', async () => {
    const Swal = (await import('sweetalert2')).default;
    component.newDate = '2024-02-01';
    component.newTime = '10:00';

    vi.spyOn(appointmentService, 'rescheduleAppointment').mockReturnValue(of({}));
    vi.spyOn(appointmentService, 'getPatientAppointments').mockReturnValue(of(mockAppointments));

    await component.confirmReschedule('apt1');

    expect(appointmentService.rescheduleAppointment).toHaveBeenCalledWith('apt1', '2024-02-01', '10:00');
    expect(component.reschedulingId()).toBeNull();
  });

  it('should confirmReschedule: shows error if no date or time selected', async () => {
    const Swal = (await import('sweetalert2')).default;
    component.newDate = '';
    component.newTime = '';

    await component.confirmReschedule('apt1');

    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: 'error',
        title: 'Error'
      })
    );
  });

  it('should getStatusClass return correct class', () => {
    expect(component.getStatusClass('confirmed')).toBe('badge-confirmed');
    expect(component.getStatusClass('pending')).toBe('badge-pending');
    expect(component.getStatusClass('cancelled')).toBe('badge-cancelled');
  });

  it('should getUserName returns firstName from auth', () => {
    expect(component.getUserName()).toBe('Juan');
  });

  it('should formatDate return correct format', () => {
    expect(component.formatDate('2024-01-15')).toBe('15 de ene');
    expect(component.formatDate('2024-03-20')).toBe('20 de mar');
    expect(component.formatDate('')).toBe('');
  });

  it('should goToNuevaCita emits patient-create', () => {
    const emitSpy = vi.spyOn(component.navigate, 'emit');

    component.goToNuevaCita();

    expect(emitSpy).toHaveBeenCalledWith('patient-create');
  });
});
