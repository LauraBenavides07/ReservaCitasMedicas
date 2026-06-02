import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthService, AuthResponse, User } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should remove "patient" key from localStorage on construction', () => {
    localStorage.setItem('patient', 'some-value');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [AuthService] });
    const s = TestBed.inject(AuthService);
    expect(localStorage.getItem('patient')).toBeNull();
  });

  it('should register a user and save session', () => {
    const data = { email: 'test@test.com', password: '123456', firstName: 'John', lastName: 'Doe' };
    const mockResponse: AuthResponse = {
      access_token: 'token-123',
      user: { id: '1', firstName: 'John', lastName: 'Doe', role: 'patient', email: 'test@test.com' }
    };

    service.register(data).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:3000/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(data);
    req.flush(mockResponse);

    expect(localStorage.getItem('access_token')).toBe('token-123');
    expect(JSON.parse(localStorage.getItem('user')!)).toEqual(mockResponse.user);
    expect(service.user()).toEqual(mockResponse.user);
    expect(service.isLoggedIn()).toBe(true);
  });

  it('should login and trim login field', () => {
    const data = { login: '  user@test.com  ', password: 'pass' };
    const mockResponse: AuthResponse = {
      access_token: 'token-456',
      user: { id: '2', firstName: 'Jane', lastName: 'Smith', role: 'staff', email: 'user@test.com' }
    };

    service.login(data).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:3000/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ login: 'user@test.com', password: 'pass' });
    req.flush(mockResponse);

    expect(localStorage.getItem('access_token')).toBe('token-456');
    expect(service.user()!.firstName).toBe('Jane');
    expect(service.isLoggedIn()).toBe(true);
  });

  it('should handle login with null/undefined login gracefully', () => {
    const data = { login: null, password: 'pass' };
    const mockResponse: AuthResponse = {
      access_token: 'token-null',
      user: { id: '3', firstName: 'Null', lastName: 'User', role: 'patient' }
    };

    service.login(data).subscribe();

    const req = httpMock.expectOne('http://localhost:3000/auth/login');
    expect(req.request.body).toEqual({ login: '', password: 'pass' });
    req.flush(mockResponse);

    const data2 = { login: undefined as string | null | undefined, password: 'pass' };
    service.login(data2).subscribe();
    const req2 = httpMock.expectOne('http://localhost:3000/auth/login');
    expect(req2.request.body).toEqual({ login: '', password: 'pass' });
    req2.flush(mockResponse);
  });

  it('should logout and clear session', () => {
    localStorage.setItem('access_token', 'token');
    localStorage.setItem('user', JSON.stringify({ id: '1', firstName: 'Test', lastName: 'User', role: 'patient' }));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [AuthService] });
    const s = TestBed.inject(AuthService);
    expect(s.isLoggedIn()).toBe(true);

    s.logout();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(s.user()).toBeNull();
    expect(s.isLoggedIn()).toBe(false);
  });

  it('should return token from localStorage via getToken()', () => {
    expect(service.getToken()).toBeNull();
    localStorage.setItem('access_token', 'my-token');
    expect(service.getToken()).toBe('my-token');
  });

  it('should get patient by document', () => {
    const mockUser: User = { id: '10', firstName: 'Paciente', lastName: 'Uno', role: 'patient', document: '12345' };

    service.getPatientByDocument('12345').subscribe(user => {
      expect(user).toEqual(mockUser);
    });

    const req = httpMock.expectOne('http://localhost:3000/auth/patient/12345');
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);
  });

  it('should return user from localStorage if pre-stored', () => {
    const user: User = { id: '5', firstName: 'Pre', lastName: 'Stored', role: 'admin' };
    localStorage.setItem('user', JSON.stringify(user));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [AuthService] });
    const s = TestBed.inject(AuthService);
    expect(s.user()).toEqual(user);
    expect(s.isLoggedIn()).toBe(true);
  });

  it('should return null user when nothing in localStorage', () => {
    expect(service.user()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });
});
