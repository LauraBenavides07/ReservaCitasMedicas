// Importaciones necesarias para el componente
import { Component, signal, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ButtonComponent } from '../../shared/atoms/button/button.component';
import { FormFieldComponent } from '../../shared/atoms/form-field/form-field.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ButtonComponent,FormFieldComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  // Evento de salida para navegación hacia el componente padre
  @Output() navigate = new EventEmitter<any>();

  // Señales para estado reactivo
  isLoading = signal(false);
  error = signal('');
  successMessage = signal('');
  showPassword = signal(false);

  // Formulario reactivo para el registro
  registerForm: FormGroup;

  // Inyección de dependencias
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  constructor() {
    // Inicialización del formulario con validaciones
    this.registerForm = this.fb.group({
      document: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      gender: ['', [Validators.required]],
      email: ['', [Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  // Getter para acceder fácilmente a los controles del formulario desde la plantilla
  get f() {
    return this.registerForm.controls;
  }

  // Maneja el envío del formulario de registro
  onSubmit(): void {
    // Si el formulario es inválido, marca todos los campos como tocados para mostrar errores
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    // Activa el estado de carga y limpia mensajes anteriores
    this.isLoading.set(true);
    this.error.set('');
    this.successMessage.set('');

    // Limpia el correo si está vacío para evitar error al validar en el servidor
    const payload = { ...this.registerForm.value };
    if (!payload.email || payload.email.trim() === '') {
      delete payload.email;
    }

    // Llama al servicio de autenticación para registrar al usuario
    this.auth.register(payload).subscribe({
      next: (response) => {
        // Registro exitoso
        this.isLoading.set(false);
        this.successMessage.set('Cuenta creada exitosamente. Redirigiendo...');

        // Redirige al login después de 1.5 segundos
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (err) => {
        // Manejo de errores del registro
        console.error('Register error:', err);
        this.isLoading.set(false);

        // Verifica si es un error de conexión
        if (err.status === 0) {
          this.error.set('No se pudo conectar con el servidor. Verifique si el backend esta corriendo.');
        } else {
          // Si el servidor devuelve un mensaje de error específico, lo muestra
          this.error.set(err.error?.message || 'Error al registrarse.');
        }
      }
    });
  }

  // Alterna la visibilidad de la contraseña
  togglePassword(): void {
    this.showPassword.update(v => !v);
  }
}
