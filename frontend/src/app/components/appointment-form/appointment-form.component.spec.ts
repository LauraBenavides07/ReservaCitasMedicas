import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppointmentFormComponent } from './appointment-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AppointmentService } from '../../services/appointment.service';
import { DoctorService } from '../../services/doctor.service';
import { AuthService } from '../../services/auth.service';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';

beforeAll(() => {
  // Mock para window.matchMedia (SweetAlert2 lo necesita)
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

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true, isDenied: false, isDismissed: false }),
  },
}));


describe('AppointmentFormComponent', () => {
  let component: AppointmentFormComponent;
  let fixture: ComponentFixture<AppointmentFormComponent>;

  const mockAppointmentService = {
    getPatientByDocument: vi.fn(),
    getAvailableSlots: vi.fn(),
    createAppointment: vi.fn()
  };
  const mockDoctorService = {
    getDoctors: vi.fn()
  };
  const mockAuthService = {
    user: vi.fn()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentFormComponent, ReactiveFormsModule, HttpClientTestingModule],
      providers: [
        { provide: AppointmentService, useValue: mockAppointmentService },
        { provide: DoctorService, useValue: mockDoctorService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppointmentFormComponent);
    component = fixture.componentInstance;
    
    mockDoctorService.getDoctors.mockReturnValue(of([]));
    mockAuthService.user.mockReturnValue(null);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not have birthDate in the form', () => {
    expect(component.appointmentForm.contains('birthDate')).toBe(false);
  });

  it('should call getPatientByDocument and patch the form when searchPatient is called', () => {
    const mockPatient = {
      firstName: 'Juan',
      lastName: 'Perez',
      phone: '123456',
      gender: 'M',
      email: 'juan@example.com'
    };
    
    component.appointmentForm.patchValue({ patientDocument: '123' });
    mockAppointmentService.getPatientByDocument.mockReturnValue(of(mockPatient));

    component.searchPatient();

    expect(mockAppointmentService.getPatientByDocument).toHaveBeenCalledWith('123');
    expect(component.appointmentForm.value.firstName).toBe('Juan');
    expect(component.appointmentForm.value.gender).toBe('M');
  });

  it('should set error message when patient is not found', () => {
    component.appointmentForm.patchValue({ patientDocument: '000' });
    mockAppointmentService.getPatientByDocument.mockReturnValue(throwError(() => new Error('Not Found')));

    component.searchPatient();

    expect(component.errorMessage()).toContain('Paciente no encontrado');
  });
});
