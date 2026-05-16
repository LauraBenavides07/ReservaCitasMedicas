import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigService, GlobalConfig } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConfigService]
    });
    service = TestBed.inject(ConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should get config', () => {
    const mockConfig: GlobalConfig = {
      id: '1',
      minAdvanceHours: 2,
      appointmentWindowDays: 30
    };

    service.getConfig().subscribe(config => {
      expect(config).toEqual(mockConfig);
    });

    const req = httpMock.expectOne('http://localhost:3000/configs');
    expect(req.request.method).toBe('GET');
    req.flush(mockConfig);
  });

  it('should update config', () => {
    const updateData: Partial<GlobalConfig> = {
      minAdvanceHours: 4,
      appointmentWindowDays: 60
    };
    const mockResponse: GlobalConfig = {
      id: '1',
      minAdvanceHours: 4,
      appointmentWindowDays: 60
    };

    service.updateConfig(updateData).subscribe(config => {
      expect(config).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:3000/configs');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(updateData);
    req.flush(mockResponse);
  });
});
