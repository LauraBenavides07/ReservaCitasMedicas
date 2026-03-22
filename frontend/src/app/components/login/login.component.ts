import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <h2 class="text-primary">Ingreso de Usuarios</h2>
      <p>Acceda a su cuenta para gestionar citas y configuraciones.</p>

      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="form-grid">
        <div class="form-field">
          <label for="login">Documento o Correo *</label>
          <input id="login" type="text" formControlName="login" placeholder="Ej: 12345678" />
        </div>

        <div class="form-field">
          <label for="password">Contraseña *</label>
          <input id="password" type="password" formControlName="password" placeholder="********" />
        </div>

        <button type="submit" class="btn-primary" [disabled]="loginForm.invalid || isLoading()">
          {{ isLoading() ? 'Cargando...' : 'Ingresar' }}
        </button>

        <div *ngIf="error()" class="alert-error">
          {{ error() }}
        </div>
      </form>
    </div>
  `,
  styles: `
    .login-container {
      background: var(--text-light);
      padding: 2.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      max-width: 450px;
      margin: 2rem auto;
    }

    .form-grid { display: grid; gap: 1.5rem; }
    .form-field { display: flex; flex-direction: column; gap: 0.5rem; }
    label { font-weight: bold; font-size: 1.1rem; }
    input { 
      border: 2px solid var(--secondary-color); 
      border-radius: 8px; 
      padding: 0.8rem; 
      font-size: 1.1rem;
      min-height: 48px;
    }
    input:focus { border-color: var(--primary-color); outline: none; }

    .btn-primary {
      background: var(--primary-color);
      color: white;
      border: none;
      padding: 1rem;
      border-radius: 8px;
      font-size: 1.2rem;
      font-weight: bold;
      cursor: pointer;
      min-height: 48px;
    }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    .alert-error {
      background: #ffebee;
      color: #c62828;
      padding: 1rem;
      border-radius: 8px;
      font-weight: bold;
      text-align: center;
    }
  `
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = signal(false);
  error = signal('');

  constructor(private fb: FormBuilder, private auth: AuthService) {
    this.loginForm = this.fb.group({
      login: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.isLoading.set(true);
    this.error.set('');

    this.auth.login(this.loginForm.value).subscribe({
      next: () => {
        // Redirigir o cambiar de vista
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Login error:', err);
        if (err.status === 0) {
          this.error.set('No se pudo conectar con el servidor. Verifique si el backend está corriendo.');
        } else {
          this.error.set(err.error?.message || 'Error al ingresar: ' + err.statusText);
        }
        this.isLoading.set(false);
      }
    });
  }
}
