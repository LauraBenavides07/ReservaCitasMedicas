import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { vi, describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';

vi.mock('sweetalert2', () => ({
  default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true }) , close: vi.fn(), showLoading: vi.fn() },
}));

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: any;
  let auth: { login: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeAll(() => {
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
  });

  beforeEach(() => {
    auth = { login: vi.fn() };
    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have login and password controls', () => {
    expect(component.loginForm.contains('login')).toBe(true);
    expect(component.loginForm.contains('password')).toBe(true);
  });

  it('should be invalid when empty', () => {
    component.loginForm.setValue({ login: '', password: '' });
    expect(component.loginForm.invalid).toBe(true);
  });

  it('should mark fields as touched when submitting an invalid form', () => {
    component.onSubmit();
    expect(component.loginForm.get('login')!.touched).toBe(true);
    expect(component.loginForm.get('password')!.touched).toBe(true);
  });

  it('should be valid when filled', () => {
    component.loginForm.setValue({ login: 'testuser', password: '12345678' });
    expect(component.loginForm.valid).toBe(true);
  });

  it('should call auth.login() and navigate for admin role', () => {
    auth.login.mockReturnValue({
      subscribe: (handlers: any) => {
        handlers.next({ user: { role: 'admin' } });
      },
    });

    component.loginForm.setValue({ login: 'admin', password: '12345678' });
    component.onSubmit();

    expect(auth.login).toHaveBeenCalledWith({ login: 'admin', password: '12345678' });
    expect(router.navigate).toHaveBeenCalledWith(['/admin/config']);
  });

  it('should navigate to /appointments/list for staff role', () => {
    auth.login.mockReturnValue({
      subscribe: (handlers: any) => {
        handlers.next({ user: { role: 'staff' } });
      },
    });

    component.loginForm.setValue({ login: 'staff', password: '12345678' });
    component.onSubmit();

    expect(router.navigate).toHaveBeenCalledWith(['/appointments/list']);
  });

  it('should navigate to /appointments/list for patient role', () => {
    auth.login.mockReturnValue({
      subscribe: (handlers: any) => {
        handlers.next({ user: { role: 'patient' } });
      },
    });

    component.loginForm.setValue({ login: 'patient', password: '12345678' });
    component.onSubmit();

    expect(router.navigate).toHaveBeenCalledWith(['/patient/dashboard']);
  });

  it('should navigate to /doctor/dashboard for doctor role', () => {
    auth.login.mockReturnValue({
      subscribe: (handlers: any) => {
        handlers.next({ user: { role: 'doctor' } });
      },
    });

    component.loginForm.setValue({ login: 'doctor', password: '12345678' });
    component.onSubmit();

    expect(router.navigate).toHaveBeenCalledWith(['/doctor/dashboard']);
  });

  it('should set error message on connection error (status 0)', () => {
    auth.login.mockReturnValue({
      subscribe: (handlers: any) => {
        handlers.error({ status: 0, statusText: 'Unknown Error' });
      },
    });

    component.loginForm.setValue({ login: 'test', password: '12345678' });
    component.onSubmit();

    expect(component.error()).toBe('No se pudo conectar con el servidor. Verifique si el backend esta corriendo.');
  });

  it('should set error message on API error with message (status 401)', () => {
    auth.login.mockReturnValue({
      subscribe: (handlers: any) => {
        handlers.error({ status: 401, statusText: 'Unauthorized', error: { message: 'Credenciales inválidas' } });
      },
    });

    component.loginForm.setValue({ login: 'test', password: 'wrong' });
    component.onSubmit();

    expect(component.error()).toBe('Credenciales inválidas');
  });

  it('should toggle showPassword signal', () => {
    expect(component.showPassword()).toBe(false);
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBe(true);
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBe(false);
  });

  it('should set isLoading signal during submit', () => {
    auth.login.mockReturnValue({
      subscribe: (handlers: any) => {
        expect(component.isLoading()).toBe(true);
        handlers.next({ user: { role: 'patient' } });
        expect(component.isLoading()).toBe(false);
      },
    });

    component.loginForm.setValue({ login: 'test', password: '12345678' });
    component.onSubmit();
  });
});
