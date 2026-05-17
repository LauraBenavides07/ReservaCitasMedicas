import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DoctorService, Doctor } from './doctor.service';

describe('DoctorService', () => {
  let service: DoctorService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DoctorService]
    });
    service = TestBed.inject(DoctorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should get all doctors', () => {
    const mockDoctors: Doctor[] = [
      { id: '1', name: 'Dr. Perez', specialty: 'Fisioterapia', scheduleStart: '08:00', scheduleEnd: '16:00', slotDuration: 30, activeDays: '1,2,3,4,5' }
    ];

    service.getDoctors().subscribe(doctors => {
      expect(doctors).toEqual(mockDoctors);
    });

    const req = httpMock.expectOne('http://localhost:3000/doctors');
    expect(req.request.method).toBe('GET');
    req.flush(mockDoctors);
  });

  it('should create a doctor', () => {
    const data: Partial<Doctor> = { name: 'Dr. Test', specialty: 'Quiropraxia', scheduleStart: '09:00', scheduleEnd: '17:00', slotDuration: 30, activeDays: '1,2,3,4,5' };
    const mockDoctor: Doctor = { id: '2', ...data } as Doctor;

    service.createDoctor(data).subscribe(doctor => {
      expect(doctor).toEqual(mockDoctor);
    });

    const req = httpMock.expectOne('http://localhost:3000/doctors');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(data);
    req.flush(mockDoctor);
  });

  it('should update a doctor', () => {
    const data: Partial<Doctor> = { specialty: 'Fisioterapia' };
    const mockDoctor: Doctor = { id: '1', name: 'Dr. Perez', specialty: 'Fisioterapia', scheduleStart: '08:00', scheduleEnd: '16:00', slotDuration: 30, activeDays: '1,2,3,4,5' };

    service.updateDoctor('1', data).subscribe(doctor => {
      expect(doctor).toEqual(mockDoctor);
    });

    const req = httpMock.expectOne('http://localhost:3000/doctors/1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(data);
    req.flush(mockDoctor);
  });

  it('should delete a doctor', () => {
    service.deleteDoctor('1').subscribe();

    const req = httpMock.expectOne('http://localhost:3000/doctors/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('should get exceptions for a doctor', () => {
    const exceptions = [{ id: 'e1', date: '2026-06-01', reason: 'Vacaciones' }];

    service.getExceptions('doc-1').subscribe(res => {
      expect(res).toEqual(exceptions);
    });

    const req = httpMock.expectOne('http://localhost:3000/doctors/doc-1/exceptions');
    expect(req.request.method).toBe('GET');
    req.flush(exceptions);
  });

  it('should add an exception for a doctor', () => {
    const data = { date: '2026-06-01', reason: 'Vacaciones' };
    const mockException = { id: 'e1', ...data };

    service.addException('doc-1', data).subscribe(res => {
      expect(res).toEqual(mockException);
    });

    const req = httpMock.expectOne('http://localhost:3000/doctors/doc-1/exceptions');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(data);
    req.flush(mockException);
  });

  it('should remove an exception', () => {
    service.removeException('doc-1', 'e1').subscribe();

    const req = httpMock.expectOne('http://localhost:3000/doctors/doc-1/exceptions/e1');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
