import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="register-container">
      <h2 class="text-primary">Registrarse como Paciente</h2>
      <p>Cree su cuenta para gestionar sus citas médicas.</p>

      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="form-grid">
        <div class="form-field">
          <label for="document">Documento de Identidad *</label>
          <input id="document" type="text" formControlName="document" placeholder="Ej: 12345678" />
        </div>

        <div class="form-field">
          <label for="firstName">Nombres *</label>
          <input id="firstName" type="text" formControlName="firstName" placeholder="Ej: Ana" />
        </div>

        <div class="form-field">
          <label for="lastName">Apellidos *</label>
          <input id="lastName" type="text" formControlName="lastName" placeholder="Ej: María" />
        </div>

        <div class="form-field">
          <label for="phone">Celular *</label>
          <input id="phone" type="tel" formControlName="phone" placeholder="Ej: 3001234567" />
        </div>

        <div class="form-field">
          <label for="gender">Género *</label>
          <select id="gender" formControlName="gender">
            <option value="">Seleccione...</option>
            <option value="Hombre">Hombre</option>
            <option value="Mujer">Mujer</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <div class="form-field">
          <label for="email">Correo Electrónico (Opcional)</label>
          <input id="email" type="email" formControlName="email" placeholder="ana@ejemplo.com" />
        </div>

        <div class="form-field">
          <label for="password">Contraseña (Mínimo 8 caracteres) *</label>
          <input id="password" type="password" formControlName="password" placeholder="********" />
        </div>

        <button type="submit" class="btn-primary" [disabled]="registerForm.invalid || isLoading()">
          {{ isLoading() ? 'Registrando...' : 'Crear Cuenta' }}
        </button>

        <div *ngIf="error()" class="alert-error">
          {{ error() }}
        </div>
      </form>
    </div>
  `,
  styles: `
    .register-container {
      background: var(--text-light);
      padding: 2.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      max-width: 600px;
      margin: 2rem auto;
    }

    .form-grid { display: grid; gap: 1.2rem; }
    .form-field { display: flex; flex-direction: column; gap: 0.4rem; }
    
    @media (min-width: 600px) {
      .form-grid { grid-template-columns: 1fr 1fr; }
      .btn-primary { grid-column: span 2; }
      .alert-error { grid-column: span 2; }
    }

    label { font-weight: bold; font-size: 1.1rem; }
    input, select { 
      border: 2px solid var(--secondary-color); 
      border-radius: 8px; 
      padding: 0.7rem; 
      font-size: 1.1rem;
      min-height: 48px;
    }
    input:focus, select:focus { border-color: var(--primary-color); outline: none; }

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
      margin-top: 1rem;
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
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = signal(false);
  error = signal('');

  constructor(private fb: FormBuilder, private auth: AuthService) {
    this.registerForm = this.fb.group({
      document: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: ['', Validators.required],
      gender: ['', Validators.required],
      email: ['', [Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;
    this.isLoading.set(true);
    this.error.set('');

    this.auth.register(this.registerForm.value).subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Error al registrarse.');
        this.isLoading.set(false);
      }
    });
  }
}
