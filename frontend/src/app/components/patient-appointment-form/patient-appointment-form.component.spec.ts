import { vi, describe, it, expect, beforeEach, beforeAll, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { PatientAppointmentFormComponent } from './patient-appointment-form.component';
import { AppointmentService, CreateAppointmentDto } from '../../services/appointment.service';
import { DoctorService, Doctor } from '../../services/doctor.service';
import { AuthService } from '../../services/auth.service';

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true, isDenied: false, isDismissed: false })
  , close: vi.fn(), showLoading: vi.fn() }
}));

describe('PatientAppointmentFormComponent', () => {
  let component: PatientAppointmentFormComponent;
  let fixture: ComponentFixture<PatientAppointmentFormComponent>;
  let appointmentService: AppointmentService;
  let doctorService: DoctorService;
  let authService: AuthService;

  const mockUser = {
    firstName: 'Juan',
    lastName: 'Pérez',
    role: 'patient' as const,
    document: '12345678',
    phone: '987654321',
    gender: 'M'
  };

  const mockDoctors: Doctor[] = [
    { id: 'doc1', name: 'Dr. García', specialty: 'Cardiología', scheduleStart: '08:00', scheduleEnd: '17:00', slotDuration: 30, activeDays: [1, 2, 3, 4, 5] },
    { id: 'doc2', name: 'Dra. López', specialty: 'Pediatría', scheduleStart: '09:00', scheduleEnd: '16:00', slotDuration: 20, activeDays: [1, 3, 5] }
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
      imports: [HttpClientTestingModule, PatientAppointmentFormComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            user: vi.fn().mockReturnValue(mockUser)
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PatientAppointmentFormComponent);
    component = fixture.componentInstance;
    appointmentService = TestBed.inject(AppointmentService);
    doctorService = TestBed.inject(DoctorService);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load doctors on init', () => {
    vi.spyOn(doctorService, 'getDoctors').mockReturnValue(of(mockDoctors));

    component.ngOnInit();

    expect(doctorService.getDoctors).toHaveBeenCalled();
    expect(component.doctors()).toEqual(mockDoctors);
  });

  it('should getDoctorColor returns consistent colors for same id', () => {
    const color1 = component.getDoctorColor('doc1');
    const color2 = component.getDoctorColor('doc1');
    expect(color1).toBe(color2);

    const color3 = component.getDoctorColor('doc2');
    expect(color1).not.toBe(color3);
  });

  it('should formatDays converts day numbers to Spanish abbreviations', () => {
    expect(component.formatDays([1,2,3,4,5])).toBe('Lun, Mar, Mié, Jue, Vie');
    expect(component.formatDays([1,3,5])).toBe('Lun, Mié, Vie');
    expect(component.formatDays([6])).toBe('Sáb');
    expect(component.formatDays([])).toBe('');
  });

  it('should selectDoctor: sets selectedDoctor, generates dates, advances to step 2', () => {
    component.selectDoctor(mockDoctors[0]);

    expect(component.selectedDoctor()).toEqual(mockDoctors[0]);
    expect(component.step()).toBe(2);
    expect(component.availableDates().length).toBeGreaterThan(0);
  });

  it('should generateDates: generates dates for next 28 days matching doctors activeDays', () => {
    const doctor: Doctor = {
      id: 'doc1',
      name: 'Dr. García',
      specialty: 'Cardiología',
      scheduleStart: '08:00',
      scheduleEnd: '17:00',
      slotDuration: 30,
      activeDays: [1]
    };

    component.generateDates(doctor);

    const dates = component.availableDates();
    expect(dates.length).toBeGreaterThan(0);

    for (const date of dates) {
      const d = new Date(date.fullDate + 'T12:00:00');
      let dayOfWeek = d.getDay();
      if (dayOfWeek === 0) dayOfWeek = 7;
      expect(dayOfWeek).toBe(1);
    }
  });

  it('should selectDate: sets selectedDate, clears selectedTime, calls getAvailableSlots, advances to step 3', () => {
    component.selectedDoctor.set(mockDoctors[0]);
    const slots = ['09:00', '10:00', '11:00'];
    vi.spyOn(appointmentService, 'getAvailableSlots').mockReturnValue(of(slots));

    const uiDate = { fullDate: '2024-01-15', dayName: 'LUN', dayNum: 15, monthName: 'ene' };
    component.selectDate(uiDate);

    expect(component.selectedDate()).toEqual(uiDate);
    expect(component.selectedTime()).toBe('');
    expect(appointmentService.getAvailableSlots).toHaveBeenCalledWith('doc1', '2024-01-15');
    expect(component.step()).toBe(3);
  });

  it('should selectDate error: sets availableSlots to empty', () => {
    component.selectedDoctor.set(mockDoctors[0]);
    vi.spyOn(appointmentService, 'getAvailableSlots').mockReturnValue(throwError(() => new Error('Error')));

    const uiDate = { fullDate: '2024-01-15', dayName: 'LUN', dayNum: 15, monthName: 'ene' };
    component.selectDate(uiDate);

    expect(component.availableSlots()).toEqual([]);
  });

  it('should selectTime: sets selectedTime, advances to step 4', () => {
    component.selectTime('10:00');

    expect(component.selectedTime()).toBe('10:00');
    expect(component.step()).toBe(4);
  });

  it('should confirmAppointment: creates appointment with user data, shows success, navigates after timeout', () => {
    vi.useFakeTimers();
    component.selectedDoctor.set(mockDoctors[0]);
    component.selectedDate.set({ fullDate: '2024-01-15', dayName: 'LUN', dayNum: 15, monthName: 'ene' });
    component.selectedTime.set('10:00');

    const navigateSpy = vi.spyOn(component.navigate, 'emit');
    vi.spyOn(appointmentService, 'createAppointment').mockReturnValue(of({
      id: 'apt1',
      time: '10:00',
      date: '2024-01-15',
      status: 'agendada',
      patient: { firstName: 'Juan', lastName: 'Pérez', document: '12345678', phone: '987654321' }
    } as any));

    component.confirmAppointment();

    expect(appointmentService.createAppointment).toHaveBeenCalledWith(
      expect.objectContaining({
        patientDocument: '12345678',
        firstName: 'Juan',
        lastName: 'Pérez',
        phone: '987654321',
        gender: 'M',
        doctorId: 'doc1',
        date: '2024-01-15',
        time: '10:00'
      })
    );

    expect(component.successMessage()).toBe('Cita agendada con éxito. Redirigiendo...');
    expect(component.isSubmitting()).toBe(false);

    vi.advanceTimersByTime(2000);
    expect(navigateSpy).toHaveBeenCalledWith('patient-dashboard');

    vi.useRealTimers();
  });

  it('should confirmAppointment: shows error if service fails', () => {
    component.selectedDoctor.set(mockDoctors[0]);
    component.selectedDate.set({ fullDate: '2024-01-15', dayName: 'LUN', dayNum: 15, monthName: 'ene' });
    component.selectedTime.set('10:00');

    vi.spyOn(appointmentService, 'createAppointment').mockReturnValue(
      throwError(() => ({ error: { message: 'Error al confirmar la cita.' } }))
    );

    component.confirmAppointment();

    expect(component.errorMessage()).toBe('Error al confirmar la cita.');
    expect(component.isSubmitting()).toBe(false);
  });

  it('should confirmAppointment: returns early if no user', () => {
    vi.spyOn(authService, 'user').mockReturnValue(null);
    const createSpy = vi.spyOn(appointmentService, 'createAppointment');

    component.confirmAppointment();

    expect(createSpy).not.toHaveBeenCalled();
  });

  it('should goToStep: only allows going backward', () => {
    component.step.set(3);

    component.goToStep(1);
    expect(component.step()).toBe(1);

    component.goToStep(2);
    expect(component.step()).toBe(1);

    component.goToStep(4);
    expect(component.step()).toBe(1);

    component.goToStep(3);
    expect(component.step()).toBe(1);
  });

  it('should getFullDateHuman returns formatted date string', () => {
    component.selectedDate.set({ fullDate: '2024-01-15', dayName: 'LUN', dayNum: 15, monthName: 'ene' });

    const result = component.getFullDateHuman();

    expect(result).toContain('lunes');
    expect(result).toContain('15');
    expect(result).toContain('enero');
    expect(result).toContain('2024');
  });

  it('should getFullDateHuman returns empty if no selected date', () => {
    component.selectedDate.set(null);
    expect(component.getFullDateHuman()).toBe('');
  });
});
