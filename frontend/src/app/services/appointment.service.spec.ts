import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AppointmentService, AppointmentResponse, Appointment, CreateAppointmentDto } from './appointment.service';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AppointmentService]
    });
    service = TestBed.inject(AppointmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should get appointments by doctor and date', () => {
    const mockResponse: AppointmentResponse = {
      appointments: [
        { id: '1', time: '10:00', date: '2026-05-20', status: 'scheduled', patient: { firstName: 'A', lastName: 'B', document: '123', phone: '555' } }
      ],
      total: 1
    };

    service.getAppointments('doc-1', '2026-05-20').subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:3000/appointments?doctorId=doc-1&date=2026-05-20');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should export appointments as blob', () => {
    const blob = new Blob(['test'], { type: 'text/csv' });

    service.exportAppointments('2026-05-20', 'doc-1').subscribe(res => {
      expect(res).toBe(blob);
    });

    const req = httpMock.expectOne('http://localhost:3000/appointments/export?date=2026-05-20&doctorId=doc-1');
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(blob);
  });

  it('should get available slots', () => {
    const slots = ['09:00', '09:30', '10:00'];

    service.getAvailableSlots('doc-1', '2026-05-20').subscribe(res => {
      expect(res).toEqual(slots);
    });

    const req = httpMock.expectOne('http://localhost:3000/appointments/available-slots?doctorId=doc-1&date=2026-05-20');
    expect(req.request.method).toBe('GET');
    req.flush(slots);
  });

  it('should create an appointment', () => {
    const dto: CreateAppointmentDto = {
      patientDocument: '12345',
      firstName: 'John',
      lastName: 'Doe',
      phone: '555-1234',
      gender: 'M',
      doctorId: 'doc-1',
      date: '2026-05-20',
      time: '10:00'
    };
    const mockAppointment: Appointment = {
      id: '1',
      time: '10:00',
      date: '2026-05-20',
      status: 'scheduled',
      patient: { firstName: 'John', lastName: 'Doe', document: '12345', phone: '555-1234' }
    };

    service.createAppointment(dto).subscribe(res => {
      expect(res).toEqual(mockAppointment);
    });

    const req = httpMock.expectOne('http://localhost:3000/appointments');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(mockAppointment);
  });

  it('should get patient appointments', () => {
    const mockAppointments = [{ id: '1', status: 'scheduled', date: '2026-05-20' }];

    service.getPatientAppointments().subscribe(res => {
      expect(res).toEqual(mockAppointments);
    });

    const req = httpMock.expectOne('http://localhost:3000/appointments/my-appointments');
    expect(req.request.method).toBe('GET');
    req.flush(mockAppointments);
  });

  it('should cancel an appointment', () => {
    service.cancelAppointment('1').subscribe();

    const req = httpMock.expectOne('http://localhost:3000/appointments/1/cancel');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({});
    req.flush({});
  });

  it('should confirm an appointment', () => {
    service.confirmAppointment('1').subscribe();

    const req = httpMock.expectOne('http://localhost:3000/appointments/1/confirm');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({});
    req.flush({});
  });

  it('should reschedule an appointment', () => {
    service.rescheduleAppointment('1', '2026-06-01', '11:00').subscribe();

    const req = httpMock.expectOne('http://localhost:3000/appointments/1/reschedule');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ date: '2026-06-01', time: '11:00' });
    req.flush({});
  });

  it('should get dashboard stats', () => {
    const stats = { total: 10, completed: 5, pending: 3, cancelled: 2 };

    service.getDashboardStats().subscribe(res => {
      expect(res).toEqual(stats);
    });

    const req = httpMock.expectOne('http://localhost:3000/appointments/stats');
    expect(req.request.method).toBe('GET');
    req.flush(stats);
  });

  it('should get all appointments', () => {
    const appointments: Appointment[] = [
      { id: '1', time: '10:00', date: '2026-05-20', status: 'scheduled', patient: { firstName: 'A', lastName: 'B', document: '123', phone: '555' } }
    ];

    service.getAllAppointments().subscribe(res => {
      expect(res).toEqual(appointments);
    });

    const req = httpMock.expectOne('http://localhost:3000/appointments/all');
    expect(req.request.method).toBe('GET');
    req.flush(appointments);
  });

  it('should get patient by document', () => {
    const patient = { firstName: 'John', lastName: 'Doe', document: '12345', phone: '555' };

    service.getPatientByDocument('12345').subscribe(res => {
      expect(res).toEqual(patient);
    });

    const req = httpMock.expectOne('http://localhost:3000/appointments/patient-by-document/12345');
    expect(req.request.method).toBe('GET');
    req.flush(patient);
  });

  it('should complete an appointment', () => {
    service.completeAppointment('1').subscribe();

    const req = httpMock.expectOne('http://localhost:3000/appointments/1/complete');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({});
    req.flush({});
  });
});
