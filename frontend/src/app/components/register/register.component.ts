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
import {validarFormatoDocumento,documentoDuplicadoValidator, validarEmailDominio} from '../../validators/registro.validators';

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
      firstName: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20)]],
      lastName: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20)]],
      phone: [
        '',
        [Validators.required, Validators.pattern('^[0-9]{10}$')],
      ],
      gender: ['', [Validators.required]],

      // Email con validador estándar de Angular y dominio específico
      email: ['', [Validators.required, Validators.email, validarEmailDominio()]],

      // Contraseña con longitud mínima
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  // Getter para acceder a los controles desde la plantilla
  get f() {
    return this.registerForm.controls;
  }

  // Maneja el envío del formulario
  onSubmit(): void {
    if (this.registerForm.invalid) {
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
          title: 'Nuevo cliente',
          html: `Cliente <strong>${firstName}</strong> creado con éxito!`,
          confirmButtonText: 'OK',
          confirmButtonColor: '#3e7ba6',
          allowOutsideClick: false,
          didClose: () => {
            this.router.navigate(['/login']);
          }
        });
      },
      error: (err) => {
        console.error('Register error:', err);
        this.isLoading.set(false);
        let errorMessage = 'Error al registrarse.';
        if (err.status === 0) {
          errorMessage = 'No se pudo conectar con el servidor. Verifique si el backend está corriendo.';
        } else if (err.status === 409) {
          errorMessage = err.error?.message || 'El documento o correo ya está registrado.';
        } else if (err.status === 500) {
          errorMessage = 'Error en el servidor. Por favor intente más tarde.';
        } else {
          errorMessage = err.error?.message || 'Error al registrarse.';
        }

        Swal.fire({
          icon: 'error',
          title: 'Error en el registro',
          html: errorMessage,
          confirmButtonText: 'OK',
          confirmButtonColor: '#ef4444',
        });
      },
    });
  }

  // Alterna visibilidad de contraseña
  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }
}