import { Component, signal, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule,FormBuilder,FormGroup,Validators} from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ButtonComponent } from '../../shared/atoms/button/button.component';
import { FormFieldComponent } from '../../shared/atoms/form-field/form-field.component';
import { AlertComponent } from '../../shared/atoms/alert/alert.component';
import Swal from 'sweetalert2';

// Importamos nuestros validadores personalizados (lb)
import {validarFormatoDocumento, documentoDuplicadoValidator, validarEmailDominio, emailDuplicadoValidator} from '../../validators/registro.validators';
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    AlertComponent,
    ButtonComponent,
    FormFieldComponent,
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  @Output() navigate = new EventEmitter<any>();

  // Señales para estado reactivo
  isLoading = signal(false);
  error = signal('');
  successMessage = signal('');
  showPassword = signal(false);

  // Formulario reactivo
  registerForm: FormGroup;

  // Inyección de dependencias
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);

  constructor() {
    this.registerForm = this.fb.group({
      // Campo documento:
      //   - Inicialización: string vacío
      //   - Validadores síncronos: required + validarFormatoDocumento() personalizado
      //   - Validador asíncrono: documentoDuplicadoValidator() que llama al backend
      document: [
        '',
        [Validators.required, validarFormatoDocumento()],
        [documentoDuplicadoValidator(this.http)],
      ],

      // Campos con validadores estándar
      firstName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      lastName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      phone: [
        '',
        [Validators.required, Validators.pattern('^[0-9]{10}$')],
      ],
      gender: ['', [Validators.required]],

      // Email con validador estándar de Angular y dominio específico
      email: ['', [Validators.required, Validators.email, validarEmailDominio()], [emailDuplicadoValidator(this.http)]],

      // Contraseña con longitud mínima
      password: ['', [Validators.required, this.validarContraseñaSegura()]],
    });
  }

  // Getter para acceder a los controles desde la plantilla
  get f() {
    return this.registerForm.controls;
  }

  // Maneja el envío del formulario
  onSubmit(): void {
    if (this.registerForm.invalid || this.registerForm.pending) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.error.set('');
    this.successMessage.set('');

    const payload = { ...this.registerForm.value };
    if (!payload.email || payload.email.trim() === '') {
      delete payload.email;
    }

    this.auth.register(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        const firstName = payload.firstName || '';
        Swal.fire({
            icon: 'success',
            title: '¡Registro exitoso!',
            html: `Bienvenido/a <strong>${firstName}</strong>.<br>Ya puedes iniciar sesión con tu cédula y contraseña.`,
            confirmButtonText: 'OK',
            confirmButtonColor: '#1e3a6a',
            target: '.auth-card', 
            customClass: {
              popup: 'swal2-front-layer'
            },
            allowOutsideClick: false, // Evita que se cierre haciendo clic fuera
            allowEscapeKey: false     // Evita que se cierre con la tecla Escape
          }).then((result) => {
            if (result.isConfirmed) { // Se ejecuta estrictamente cuando presionan "OK"
              this.registerForm.reset();
              this.navigate.emit('login'); 
            }
          });
        },
      error: (err: any) => {
        this.isLoading.set(false);

        if (err.status === 0) {
          this.error.set('No se pudo conectar con el servidor. Verifique si el backend está corriendo.');
          return;
        }

        const raw = err.error?.message;
        const backendMessage = Array.isArray(raw)
          ? raw.join(' ').toLowerCase()
          : (typeof raw === 'string' ? raw.toLowerCase() : '');

        if (err.status === 409) {
          if (backendMessage.includes('document') || backendMessage.includes('cédula') || backendMessage.includes('cedula')) {
            this.registerForm.get('document')?.setErrors({ documentoDuplicado: true });
            this.registerForm.get('document')?.markAsTouched();
            this.error.set('');
          } else if (backendMessage.includes('correo') || backendMessage.includes('email')) {
            this.registerForm.get('email')?.setErrors({ emailDuplicado: true });
            this.registerForm.get('email')?.markAsTouched();
            this.error.set('');
          } else {
            this.error.set(Array.isArray(raw) ? raw.join(', ') : (raw || 'El documento o correo ya está registrado.'));
          }
        } else if (err.status === 500) {
          this.error.set('Error en el servidor. Por favor intente más tarde.');
        } else {
          this.error.set(Array.isArray(raw) ? raw.join(', ') : (raw || 'Error al registrarse.'));
        }
      }
    });
  }

  // Alterna visibilidad de contraseña
  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  // Validador de contraseña segura
  validarContraseñaSegura() {
    return (control: any) => {
      const value = control.value || '';
      const errors: any = {};
      
      // Mínimo 8 caracteres
      if (value.length < 8) {
        errors.minlength = true;
      }
      
      // Al menos una letra mayúscula
      if (!/[A-Z]/.test(value)) {
        errors.mayuscula = true;
      }
      
      // Al menos una letra minúscula
      if (!/[a-z]/.test(value)) {
        errors.minuscula = true;
      }
      
      // Al menos un número
      if (!/[0-9]/.test(value)) {
        errors.numero = true;
      }
      
      return Object.keys(errors).length === 0 ? null : { contraseñaInsegura: errors };
    };
  }

  // Getters para validar requisitos en tiempo real
  get newPass(): string { 
    return this.registerForm.get('password')?.value || ''; 
  }

  hasMinLength(): boolean { 
    return this.newPass.length >= 8; 
  }

  hasUppercase(): boolean { 
    return /[A-Z]/.test(this.newPass); 
  }

  hasLowercase(): boolean { 
    return /[a-z]/.test(this.newPass); 
  }

  hasNumber(): boolean { 
    return /\d/.test(this.newPass); 
  }

  // Fortaleza de la contraseña
  strengthClass(): string {
    const score = [this.hasMinLength(), this.hasUppercase(), this.hasLowercase(), this.hasNumber()]
      .filter(Boolean).length;
    if (score <= 2) return 'weak';
    if (score === 3) return 'medium';
    return 'strong';
  }

  strengthLabel(): string {
    const map: Record<string, string> = { weak: 'Débil', medium: 'Media', strong: 'Fuerte' };
    return map[this.strengthClass()];
  }

  // Método para obtener el mensaje de error de contraseña
  getPasswordError(): string {
    const control = this.f['password'];
    if (!control.invalid || !control.touched) return '';
    
    const errors = control.errors?.['contraseñaInsegura'];
    if (!errors) return 'La contraseña es obligatoria.';
    
    if (errors.minlength) return 'La contraseña debe tener al menos 8 caracteres.';
    if (errors.mayuscula) return 'La contraseña debe tener al menos una letra mayúscula.';
    if (errors.minuscula) return 'La contraseña debe tener al menos una letra minúscula.';
    if (errors.numero) return 'La contraseña debe tener al menos un número.';
    
    return 'La contraseña no es segura.';
  }
}