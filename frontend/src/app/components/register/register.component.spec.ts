import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { vi, describe, it, expect, beforeEach, beforeAll } from 'vitest';
import Swal from 'sweetalert2';
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

  function disableAsyncValidators(): void {
    const documentControl = component.registerForm.get('document')!;
    const emailControl = component.registerForm.get('email')!;
    [documentControl, emailControl].forEach(ctrl => {
      ctrl.clearAsyncValidators();
      ctrl.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    });
  }

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

  it('should require email and set required error when empty', () => {
    const emailControl = component.registerForm.get('email');
    emailControl!.setValue('');
    emailControl!.markAsTouched();
    expect(emailControl!.invalid).toBe(true);
    expect(emailControl!.errors).toHaveProperty('required');
  });

  it('should validate firstName and lastName minlength and maxlength', () => {
    const first = component.registerForm.get('firstName')!;
    const last = component.registerForm.get('lastName')!;

    first.setValue('An'); // 2 chars
    first.markAsTouched();
    expect(first.invalid).toBe(true);
    expect(first.errors).toHaveProperty('minlength');

    first.setValue('A'.repeat(21)); // 21 chars
    expect(first.invalid).toBe(true);
    expect(first.errors).toHaveProperty('maxlength');

    last.setValue('An');
    last.markAsTouched();
    expect(last.invalid).toBe(true);
    expect(last.errors).toHaveProperty('minlength');

    last.setValue('B'.repeat(25));
    expect(last.invalid).toBe(true);
    expect(last.errors).toHaveProperty('maxlength');
  });

  it('should invalidate email with disallowed domain or bad format', () => {
    const email = component.registerForm.get('email')!;
    email.setValue('not-an-email');
    email.markAsTouched();
    expect(email.invalid).toBe(true);
    // Either format or domain error expected
    expect(email.errors && (email.errors['invalidEmailFormat'] || email.errors['invalidEmailDomain'])).toBeTruthy();

    email.setValue('user@otherdomain.com');
    expect(email.invalid).toBe(true);
    expect(email.errors).toHaveProperty('invalidEmailDomain');
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
    disableAsyncValidators();

    component.registerForm.setValue({
      document: '12345678',
      firstName: 'Juana',
      lastName: 'Pérez',
      phone: '9876543210',
      gender: 'M',
      email: 'juan@gmail.com',
      password: 'Password123',
    });
    if (!component.registerForm.valid) {
      console.log('FORM STATUS', component.registerForm.status);
      console.log('FORM ERRORS DEBUG', {
        document: component.registerForm.get('document')!.errors,
        firstName: component.registerForm.get('firstName')!.errors,
        lastName: component.registerForm.get('lastName')!.errors,
        phone: component.registerForm.get('phone')!.errors,
        gender: component.registerForm.get('gender')!.errors,
        email: component.registerForm.get('email')!.errors,
        password: component.registerForm.get('password')!.errors,
      });
    }
    expect(component.registerForm.valid).toBe(true);
  });

  it('should call auth.register() with form data on submit', () => {
    disableAsyncValidators();
    auth.register.mockReturnValue({
      subscribe: (handlers: any) => {
        handlers.next({});
      },
    });

    const formData = {
      document: '12345678',
      firstName: 'Juana',
      lastName: 'Pérez',
      phone: '9876543210',
      gender: 'M',
      email: 'juan@gmail.com',
      password: 'Password123',
    };

    component.registerForm.setValue(formData);
    component.onSubmit();

    expect(auth.register).toHaveBeenCalledWith(formData);
  });

  it('should not call auth.register when email is empty', () => {
    disableAsyncValidators();
    auth.register.mockReturnValue({
      subscribe: (handlers: any) => {
        handlers.next({});
      },
    });

    component.registerForm.setValue({
      document: '12345678',
      firstName: 'Juana',
      lastName: 'Pérez',
      phone: '9876543210',
      gender: 'M',
      email: '',
      password: 'Password123',
    });
    component.onSubmit();

    expect(component.registerForm.invalid).toBe(true);
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('should set error message on connection error (status 0)', () => {
    disableAsyncValidators();
    auth.register.mockReturnValue({
      subscribe: (handlers: any) => {
        handlers.error({ status: 0, statusText: 'Unknown Error' });
      },
    });

    component.registerForm.setValue({
      document: '12345678',
      firstName: 'Juana',
      lastName: 'Pérez',
      phone: '9876543210',
      gender: 'M',
      email: 'juan@gmail.com',
      password: 'Password123',
    });
    component.onSubmit();

    expect(component.error()).toBe('No se pudo conectar con el servidor. Verifique si el backend está corriendo.');
  });

  it('should set error message on API error', () => {
    disableAsyncValidators();
    auth.register.mockReturnValue({
      subscribe: (handlers: any) => {
        handlers.error({ status: 400, statusText: 'Bad Request', error: { message: 'El documento ya existe' } });
      },
    });

    component.registerForm.setValue({
      document: '12345678',
      firstName: 'Juan',
      lastName: 'Pérez',
      phone: '9876543210',
      gender: 'M',
      email: 'juan@gmail.com',
      password: 'Password123',
    });
    component.onSubmit();

    expect(component.error()).toBe('El documento ya existe');
  });

  it('should show success alert and emit login navigation on success', async () => {
    disableAsyncValidators();
    const navigateSpy = vi.spyOn(component.navigate, 'emit');

    auth.register.mockReturnValue({
      subscribe: (handlers: any) => {
        handlers.next({});
      },
    });

    component.registerForm.setValue({
      document: '12345678',
      firstName: 'Juan',
      lastName: 'Pérez',
      phone: '9876543210',
      gender: 'M',
      email: 'juan@gmail.com',
      password: 'Password123',
    });
    component.onSubmit();
    await Promise.resolve();

    expect(Swal.fire).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith('login');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should toggle showPassword signal', () => {
    expect(component.showPassword()).toBe(false);
    component.togglePassword();
    expect(component.showPassword()).toBe(true);
    component.togglePassword();
    expect(component.showPassword()).toBe(false);
  });
});
