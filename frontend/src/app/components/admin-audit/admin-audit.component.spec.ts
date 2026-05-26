import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminAuditComponent } from './admin-audit.component';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AppointmentService } from '../../services/appointment.service';
import { DoctorService } from '../../services/doctor.service';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Swal from 'sweetalert2';

describe('AdminAuditComponent', () => {
  let component: AdminAuditComponent;
  let fixture: ComponentFixture<AdminAuditComponent>;

  const mockAppointmentService = {
    getAllHistory: vi.fn()
  };
  const mockDoctorService = {
    getDoctors: vi.fn()
  };

  const mockHistoryResponse = {
    total: 2,
    history: [
      {
        id: 'h1',
        appointmentId: 'a1',
        changeType: 'CREATED',
        previousDate: null,
        previousTime: null,
        previousStatus: null,
        newDate: null,
        newTime: null,
        newStatus: 'PENDING',
        changedBy: 'patient@test.com',
        changedByRole: 'patient',
        reason: null,
        changedAt: '2026-05-25T10:00:00Z',
        doctorName: 'Dr. Pérez',
        patientName: 'Juan López'
      },
      {
        id: 'h2',
        appointmentId: 'a2',
        changeType: 'CONFIRMED',
        previousDate: null,
        previousTime: null,
        previousStatus: 'PENDING',
        newDate: null,
        newTime: null,
        newStatus: 'CONFIRMED',
        changedBy: 'staff@test.com',
        changedByRole: 'staff',
        reason: null,
        changedAt: '2026-05-25T11:00:00Z',
        doctorName: 'Dra. Gómez',
        patientName: 'Ana Martínez'
      }
    ]
  };

  const mockDoctors = [
    { id: 'd1', name: 'Dr. Pérez', specialty: 'General' },
    { id: 'd2', name: 'Dra. Gómez', specialty: 'Pediatría' }
  ];

  beforeEach(async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
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

    vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: true } as any);

    mockAppointmentService.getAllHistory.mockReturnValue(of(mockHistoryResponse));
    mockDoctorService.getDoctors.mockReturnValue(of(mockDoctors));

    await TestBed.configureTestingModule({
      imports: [AdminAuditComponent, FormsModule, HttpClientTestingModule],
      providers: [
        { provide: AppointmentService, useValue: mockAppointmentService },
        { provide: DoctorService, useValue: mockDoctorService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminAuditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load doctors on init', () => {
    expect(mockDoctorService.getDoctors).toHaveBeenCalled();
    expect(component.doctors.length).toBe(2);
  });

  it('should load history on init', () => {
    expect(mockAppointmentService.getAllHistory).toHaveBeenCalledWith({ limit: 50 });
    expect(component.history.length).toBe(2);
    expect(component.total).toBe(2);
  });

  it('should apply filters and reload history', () => {
    component.filterChangeType = 'CONFIRMED';
    component.filterDoctorId = 'd1';
    component.filterDate = '2026-05-25';
    component.filterSearch = 'Juan';

    component.applyFilter();

    expect(mockAppointmentService.getAllHistory).toHaveBeenCalledWith({
      limit: 50,
      changeType: 'CONFIRMED',
      doctorId: 'd1',
      date: '2026-05-25',
      search: 'Juan'
    });
  });

  it('should clear all filters and reload', () => {
    component.filterChangeType = 'CANCELLED';
    component.filterDoctorId = 'd1';
    component.filterDate = '2026-05-25';
    component.filterSearch = 'test';

    component.clearFilters();

    expect(component.filterChangeType).toBe('');
    expect(component.filterDoctorId).toBe('');
    expect(component.filterDate).toBe('');
    expect(component.filterSearch).toBe('');
    expect(mockAppointmentService.getAllHistory).toHaveBeenCalledWith({ limit: 50 });
  });

  it('should handle empty history response', () => {
    mockAppointmentService.getAllHistory.mockReturnValue(of({ total: 0, history: [] }));

    component.loadHistory();

    expect(component.history.length).toBe(0);
    expect(component.total).toBe(0);
  });

  it('should handle API error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockAppointmentService.getAllHistory.mockReturnValue(of(null as any));
    component.loadHistory();

    expect(component.history.length).toBe(0);
    expect(component.total).toBe(0);
    consoleSpy.mockRestore();
  });

  it('should export to CSV', () => {
    const createSpy = vi.spyOn(document, 'createElement');
    component.exportToCSV();
    expect(createSpy).toHaveBeenCalledWith('a');
    createSpy.mockRestore();
  });

  it('should show error toast on export with empty history', () => {
    component.history = [];
    const swalSpy = vi.spyOn(Swal, 'fire');
    component.exportToCSV();
    expect(swalSpy).toHaveBeenCalledWith(
      expect.objectContaining({ icon: 'error', text: 'No hay datos para exportar' })
    );
    swalSpy.mockRestore();
  });

  it('should format change type labels', () => {
    expect(component.getChangeLabel('CREATED')).toBe('➕ Creada');
    expect(component.getChangeLabel('RESCHEDULED')).toBe('🔄 Reagendada');
    expect(component.getChangeLabel('UNKNOWN')).toBe('UNKNOWN');
  });

  it('should format date time', () => {
    const d = new Date('2026-05-25T10:30:00Z');
    const expectedDay = String(d.getDate()).padStart(2, '0');
    const expectedMonth = String(d.getMonth() + 1).padStart(2, '0');
    const expectedYear = d.getFullYear();
    const expectedHour = String(d.getHours()).padStart(2, '0');
    const expectedMin = String(d.getMinutes()).padStart(2, '0');
    const result = component.formatDateTime('2026-05-25T10:30:00Z');
    expect(result).toBe(`${expectedDay}/${expectedMonth}/${expectedYear} ${expectedHour}:${expectedMin}`);
  });

  it('should format date', () => {
    expect(component.formatDate('2026-05-25')).toBe('25/05/2026');
    expect(component.formatDate(null)).toBe('-');
  });

  it('should format time in 12h format', () => {
    expect(component.formatTime('10:30')).toContain('AM');
    expect(component.formatTime('15:00')).toContain('PM');
    expect(component.formatTime(null)).toBe('-');
  });

  it('should display responsible user info', () => {
    expect(component.getResponsibleDisplay('patient@test.com', 'patient')).toContain('Paciente');
    expect(component.getResponsibleDisplay('admin@test.com', 'admin')).not.toContain('Paciente');
    expect(component.getResponsibleDisplay('', 'patient')).toBe('-');
  });

  it('should return role labels', () => {
    expect(component.getRoleLabel('admin')).toBe('Administrador');
    expect(component.getRoleLabel('doctor')).toBe('Médico');
    expect(component.getRoleLabel('patient')).toBe('Paciente');
    expect(component.getRoleLabel('unknown')).toBe('unknown');
  });

  it('should track by entry id', () => {
    expect(component.trackById(0, { id: 'h1' } as any)).toBe('h1');
  });
});
