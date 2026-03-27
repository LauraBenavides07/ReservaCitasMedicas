import { Component, signal, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  // Evento para navegar entre vistas (login / register / landing)
  @Output() navigate = new EventEmitter<any>();

  // Signals (estado reactivo moderno en Angular)
  isLoading = signal(false);
  error = signal('');
  showPassword = signal(false);

  // Formulario reactivo
  loginForm: FormGroup;

  // Inyección de dependencias
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  constructor() {
    // Definición del formulario con validaciones
    this.loginForm = this.fb.group({
      login: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  // Getter para acceder fácil a los controles del formulario
  get f() {
    return this.loginForm.controls;
  }

  // Alterna la visibilidad de la contraseña
  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  // Método que se ejecuta al enviar el formulario
  onSubmit(): void {

    // Si el formulario es inválido, marca todos los campos como tocados
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    // Activa estado de carga y limpia errores
    this.isLoading.set(true);
    this.error.set('');

    // Llamado al servicio de login
    this.auth.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.isLoading.set(false);

        // Redirige según el rol del usuario
        this.redirectByRole(response.user.role);
      },
      error: (err) => {
        console.error('Login error:', err);

        // Desactiva loading
        this.isLoading.set(false);

        // Manejo de errores
        if (err.status === 0) {
          this.error.set('No se pudo conectar con el servidor. Verifique si el backend esta corriendo.');
        } else {
          this.error.set(err.error?.message || 'Error al ingresar: ' + err.statusText);
        }
      }
    });
  }

  // Redirige según el rol del usuario
  private redirectByRole(role: string): void {

    // Normaliza el texto (minúsculas y sin espacios)
    const normalizedRole = role.toLowerCase().trim();

    if (normalizedRole === 'admin') {
      this.router.navigate(['/admin/config']);

    } else if (normalizedRole === 'staff' || normalizedRole === 'scheduler') {
      this.router.navigate(['/appointments/list']);

    } else if (normalizedRole === 'patient') {
      this.router.navigate(['/appointments/list']);

    } else {
      this.router.navigate(['/']);
    }
  }
}