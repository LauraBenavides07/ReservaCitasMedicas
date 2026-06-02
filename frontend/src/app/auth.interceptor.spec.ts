import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './services/auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        AuthService,
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add Authorization header when token exists', () => {
    localStorage.setItem('access_token', 'test-token-123');

    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token-123');
    req.flush({});
  });

  it('should not add Authorization header when no token', () => {
    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should call logout and reload on 401 error', () => {
    const logoutSpy = vi.spyOn(authService, 'logout');

    http.get('/api/test').subscribe({
      error: () => {},
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(logoutSpy).toHaveBeenCalledOnce();
  });

  it('should rethrow non-401 error without logout', () => {
    const logoutSpy = vi.spyOn(authService, 'logout');

    http.get('/api/test').subscribe({
      error: (err) => {
        expect(err.status).toBe(500);
      },
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({ message: 'Server Error' }, { status: 500, statusText: 'Server Error' });

    expect(logoutSpy).not.toHaveBeenCalled();
  });
});
