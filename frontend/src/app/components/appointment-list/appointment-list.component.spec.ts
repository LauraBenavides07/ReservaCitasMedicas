import { vi, describe, it, expect, beforeEach, beforeAll, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { AppointmentListComponent } from './appointment-list.component';
import { AppointmentService, AppointmentResponse } from '../../services/appointment.service';
import { DoctorService, Doctor } from '../../services/doctor.service';

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true, isDenied: false, isDismissed: false }),
    close: vi.fn(),
    showLoading: vi.fn()
  }
}));

describe('AppointmentListComponent', () => {
  let component: AppointmentListComponent;
  let fixture: ComponentFixture<AppointmentListComponent>;
  let appointmentService: AppointmentService;
  let doctorService: DoctorService;
  let cdr: ChangeDetectorRef;

  const mockDoctors: Doctor[] = [
    { id: 'doc1', name: 'Dr. García', specialty: 'Cardiología', scheduleStart: '08:00', scheduleEnd: '17:00', slotDuration: 30, activeDays: [1, 2, 3, 4, 5] },
    { id: 'doc2', name: 'Dra. López', specialty: 'Pediatría', scheduleStart: '09:00', scheduleEnd: '16:00', slotDuration: 20, activeDays: [1, 3, 5] }
  ];

  const mockAppointments: AppointmentResponse = {
    appointments: [
      { id: 'apt1', time: '09:00', date: '2024-01-15', status: 'confirmed', patient: { firstName: 'Juan', lastName: 'Pérez', document: '12345', phone: '987654321' } }
    ],
    total: 1
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
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AppointmentListComponent],
      providers: [
        { provide: ChangeDetectorRef, useValue: { detectChanges: vi.fn() } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppointmentListComponent);
    component = fixture.componentInstance;
    appointmentService = TestBed.inject(AppointmentService);
    doctorService = TestBed.inject(DoctorService);
    cdr = TestBed.inject(ChangeDetectorRef);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load doctors on init and select first doctor automatically', () => {
    vi.spyOn(doctorService, 'getDoctors').mockReturnValue(of(mockDoctors));

    component.ngOnInit();

    expect(doctorService.getDoctors).toHaveBeenCalled();
    expect(component.doctors).toEqual(mockDoctors);
    expect(component.selectedDoctorId).toBe('doc1');
  });

  it('should handle loadDoctors error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(doctorService, 'getDoctors').mockReturnValue(throwError(() => new Error('Network error')));

    component.loadDoctors();

    expect(consoleSpy).toHaveBeenCalledWith('Error loading doctors:', expect.any(Error));
    expect(component.selectedDoctorId).toBeNull();
    consoleSpy.mockRestore();
  });

  it('should load appointments: calls service with doctorId and date, sets appointments and total', () => {
    component.selectedDoctorId = 'doc1';
    component.selectedDate = '2024-01-15';
    vi.spyOn(appointmentService, 'getAppointments').mockReturnValue(of(mockAppointments));

    component.loadAppointments();

    expect(appointmentService.getAppointments).toHaveBeenCalledWith('doc1', '2024-01-15');
    expect(component.appointments).toEqual(mockAppointments.appointments);
    expect(component.total).toBe(1);
  });

  it('should load appointments: sets loading state', () => {
    component.selectedDoctorId = 'doc1';
    component.selectedDate = '2024-01-15';
    vi.spyOn(appointmentService, 'getAppointments').mockReturnValue(of(mockAppointments));

    component.loadAppointments();

    expect(component.loading).toBe(false);
  });

  it('should return early if no doctorId or date', () => {
    const spy = vi.spyOn(appointmentService, 'getAppointments');

    component.selectedDoctorId = null;
    component.selectedDate = '2024-01-15';
    component.loadAppointments();
    expect(spy).not.toHaveBeenCalled();

    component.selectedDoctorId = 'doc1';
    component.selectedDate = '';
    component.loadAppointments();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should loadAllAppointments: calls getAllAppointments, sets viewMode to all', () => {
    const allAppointments = mockAppointments.appointments;
    vi.spyOn(appointmentService, 'getAllAppointments').mockReturnValue(of(allAppointments));

    component.loadAllAppointments();

    expect(appointmentService.getAllAppointments).toHaveBeenCalled();
    expect(component.viewMode).toBe('all');
    expect(component.hasSearched).toBe(true);
    expect(component.appointments).toEqual(allAppointments);
    expect(component.total).toBe(1);
  });

  it('should onSearch: calls getAppointments, sets viewMode to filter', () => {
    component.selectedDoctorId = 'doc1';
    component.selectedDate = '2024-01-15';
    vi.spyOn(appointmentService, 'getAppointments').mockReturnValue(of(mockAppointments));

    component.onSearch();

    expect(appointmentService.getAppointments).toHaveBeenCalledWith('doc1', '2024-01-15');
    expect(component.viewMode).toBe('filter');
    expect(component.hasSearched).toBe(true);
  });

  it('should onSearch: return early if no doctorId or date', () => {
    const spy = vi.spyOn(appointmentService, 'getAppointments');

    component.selectedDoctorId = null;
    component.onSearch();
    expect(spy).not.toHaveBeenCalled();

    component.selectedDoctorId = 'doc1';
    component.selectedDate = '';
    component.onSearch();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should exportCsv: show warning if no doctor/date selected', async () => {
    const Swal = (await import('sweetalert2')).default;

    component.selectedDoctorId = null;
    component.selectedDate = '2024-01-15';
    component.exportCsv();

    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: 'warning',
        title: 'Filtros requeridos'
      })
    );
  });

  it('should exportCsv: call exportAppointments and create download link on success', async () => {
    const Swal = (await import('sweetalert2')).default;
    component.selectedDoctorId = 'doc1';
    component.selectedDate = '2024-01-15';

    const mockBlob = new Blob(['csv content'], { type: 'text/csv' });
    vi.spyOn(appointmentService, 'exportAppointments').mockReturnValue(of(mockBlob));

    const createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:url');
    const revokeObjectURLSpy = vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: vi.fn()
    } as unknown as HTMLAnchorElement);

    component.exportCsv();

    expect(appointmentService.exportAppointments).toHaveBeenCalledWith('2024-01-15', 'doc1');
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalled();

    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
    createElementSpy.mockRestore();
  });

  it('should getAlBadgeClass return correct classes for different statuses', () => {
    expect(component.getAlBadgeClass('confirmed')).toBe('al-badge--confirmed');
    expect(component.getAlBadgeClass('pending')).toBe('al-badge--pending');
    expect(component.getAlBadgeClass('cancelled')).toBe('al-badge--cancelled');
    expect(component.getAlBadgeClass(undefined)).toBe('al-badge--desconocido');
    expect(component.getAlBadgeClass('')).toBe('al-badge--desconocido');
  });

  it('should formatDate return correct format for valid dates', () => {
    expect(component.formatDate('2024-01-15')).toBe('15/01/2024');
    expect(component.formatDate('2024-03-20')).toBe('20/03/2024');
    expect(component.formatDate('2024-12-31')).toBe('31/12/2024');
  });

  it('should formatDate return N/A for undefined', () => {
    expect(component.formatDate(undefined)).toBe('N/A');
    expect(component.formatDate('')).toBe('N/A');
  });

  it('should formatDate return original string on error', () => {
    expect(component.formatDate('invalid-date-string!!!')).toBe('NaN/NaN/NaN');
  });
});
