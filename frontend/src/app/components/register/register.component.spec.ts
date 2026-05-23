import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { vi, describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth.service';

vi.mock('sweetalert2', () => ({
  default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true }) , close: vi.fn(), showLoading: vi.fn() },
}));

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: any;
  let auth: { register: ReturnType<typeof vi.fn> };
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
    auth = { register: vi.fn() };
    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [RegisterComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have all required form controls with validators', () => {
    expect(component.registerForm.contains('document')).toBe(true);
    expect(component.registerForm.contains('firstName')).toBe(true);
    expect(component.registerForm.contains('lastName')).toBe(true);
    expect(component.registerForm.contains('phone')).toBe(true);
    expect(component.registerForm.contains('gender')).toBe(true);
    expect(component.registerForm.contains('email')).toBe(true);
    expect(component.registerForm.contains('password')).toBe(true);
  });

  it('should be invalid when empty', () => {
    component.registerForm.setValue({
      document: '',
      firstName: '',
      lastName: '',
      phone: '',
      gender: '',
      email: '',
      password: '',
    });
    expect(component.registerForm.invalid).toBe(true);
  });

  it('should mark fields as touched when submitting an invalid form', () => {
    component.onSubmit();
    expect(component.registerForm.get('document')!.touched).toBe(true);
    expect(component.registerForm.get('firstName')!.touched).toBe(true);
    expect(component.registerForm.get('lastName')!.touched).toBe(true);
    expect(component.registerForm.get('phone')!.touched).toBe(true);
    expect(component.registerForm.get('gender')!.touched).toBe(true);
    expect(component.registerForm.get('password')!.touched).toBe(true);
  });

  it('should be valid when filled with correct data', () => {
    component.registerForm.setValue({
      document: '12345678',
      firstName: 'Juan',
      lastName: 'Pérez',
      phone: '987654321',
      gender: 'M',
      email: 'juan@example.com',
      password: 'password123',
    });
    expect(component.registerForm.valid).toBe(true);
  });

  it('should call auth.register() with form data on submit', () => {
    auth.register.mockReturnValue({
      subscribe: (handlers: any) => {
        handlers.next({});
      },
    });

    const formData = {
      document: '12345678',
      firstName: 'Juan',
      lastName: 'Pérez',
      phone: '987654321',
      gender: 'M',
      email: 'juan@example.com',
      password: 'password123',
    };

    component.registerForm.setValue(formData);
    component.onSubmit();

    expect(auth.register).toHaveBeenCalledWith(formData);
  });

  it('should remove email from payload when empty', () => {
    auth.register.mockReturnValue({
      subscribe: (handlers: any) => {
        handlers.next({});
      },
    });

    component.registerForm.setValue({
      document: '12345678',
      firstName: 'Juan',
      lastName: 'Pérez',
      phone: '987654321',
      gender: 'M',
      email: '',
      password: 'password123',
    });
    component.onSubmit();

    const payload = auth.register.mock.calls[0][0];
    expect(payload).not.toHaveProperty('email');
  });

  it('should set error message on connection error (status 0)', () => {
    auth.register.mockReturnValue({
      subscribe: (handlers: any) => {
        handlers.error({ status: 0, statusText: 'Unknown Error' });
      },
    });

    component.registerForm.setValue({
      document: '12345678',
      firstName: 'Juan',
      lastName: 'Pérez',
      phone: '987654321',
      gender: 'M',
      email: 'juan@example.com',
      password: 'password123',
    });
    component.onSubmit();

    expect(component.error()).toBe('No se pudo conectar con el servidor. Verifique si el backend esta corriendo.');
  });

  it('should set error message on API error', () => {
    auth.register.mockReturnValue({
      subscribe: (handlers: any) => {
        handlers.error({ status: 400, statusText: 'Bad Request', error: { message: 'El documento ya existe' } });
      },
    });

    component.registerForm.setValue({
      document: '12345678',
      firstName: 'Juan',
      lastName: 'Pérez',
      phone: '987654321',
      gender: 'M',
      email: 'juan@example.com',
      password: 'password123',
    });
    component.onSubmit();

    expect(component.error()).toBe('El documento ya existe');
  });

  it('should set successMessage and navigate to /login on success', () => {
    vi.useFakeTimers();

    auth.register.mockReturnValue({
      subscribe: (handlers: any) => {
        handlers.next({});
      },
    });

    component.registerForm.setValue({
      document: '12345678',
      firstName: 'Juan',
      lastName: 'Pérez',
      phone: '987654321',
      gender: 'M',
      email: 'juan@example.com',
      password: 'password123',
    });
    component.onSubmit();

    expect(component.successMessage()).toBe('Cuenta creada exitosamente. Redirigiendo...');
    expect(router.navigate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1500);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);

    vi.useRealTimers();
  });

  it('should toggle showPassword signal', () => {
    expect(component.showPassword()).toBe(false);
    component.togglePassword();
    expect(component.showPassword()).toBe(true);
    component.togglePassword();
    expect(component.showPassword()).toBe(false);
  });
});
