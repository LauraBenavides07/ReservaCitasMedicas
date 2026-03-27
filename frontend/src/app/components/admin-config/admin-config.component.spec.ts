import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminConfigComponent } from './admin-config.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DoctorService } from '../../services/doctor.service';
import { AppointmentService } from '../../services/appointment.service';
import { ConfigService } from '../../services/config.service';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('AdminConfigComponent', () => {
  let component: AdminConfigComponent;
  let fixture: ComponentFixture<AdminConfigComponent>;

  const mockDoctorService = {
    getDoctors: vi.fn(),
    deleteDoctor: vi.fn(),
    createDoctor: vi.fn(),
    updateDoctor: vi.fn()
  };
  const mockAppointmentService = {
    getDashboardStats: vi.fn()
  };
  const mockConfigService = {
    getConfig: vi.fn(),
    updateConfig: vi.fn()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminConfigComponent, ReactiveFormsModule, FormsModule, HttpClientTestingModule],
      providers: [
        { provide: DoctorService, useValue: mockDoctorService },
        { provide: AppointmentService, useValue: mockAppointmentService },
        { provide: ConfigService, useValue: mockConfigService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminConfigComponent);
    component = fixture.componentInstance;
    
    mockDoctorService.getDoctors.mockReturnValue(of([]));
    mockAppointmentService.getDashboardStats.mockReturnValue(of({ stats: {}, doctorStats: [] }));
    mockConfigService.getConfig.mockReturnValue(of({ minAdvanceHours: 2, appointmentWindowWeeks: 4 }));
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a list of specialties including Quiropraxia', () => {
    expect(component.specialties).toContain('Quiropraxia');
    expect(component.specialties).toContain('Fisioterapia');
  });

  it('should patch the form with the selected specialty', () => {
    component.doctorForm.patchValue({ specialty: 'Quiropraxia' });
    expect(component.doctorForm.value.specialty).toBe('Quiropraxia');
  });
});
