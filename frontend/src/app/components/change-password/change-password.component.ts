import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ButtonComponent } from '../../shared/atoms/button/button.component';
import { FormFieldComponent } from '../../shared/atoms/form-field/form-field.component';
import { AlertComponent } from '../../shared/atoms/alert/alert.component';
import { CardComponent } from '../../shared/atoms/card/card.component';  // ✅ Agregar import
import Swal from 'sweetalert2';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
    selector: 'app-change-password',
    standalone: true,
    imports: [  
        CommonModule, 
        ReactiveFormsModule, 
        ButtonComponent, 
        FormFieldComponent, 
        AlertComponent,
        CardComponent  
    ],
    template: `
        <div class="change-password-container">
            <div class="cp-card">
                <div class="cp-header">
                    <h3>🔐 Cambiar Contraseña</h3>
                    <p>Por seguridad, debes cambiar tu contraseña temporal antes de continuar.</p>
                </div>

                <form [formGroup]="passwordForm" (ngSubmit)="onSubmit()">

                    <!-- Contraseña actual -->
                    <div class="field-group">
                        <label>CONTRASEÑA ACTUAL <span class="req">*</span></label>
                        <div class="input-wrapper">
                            <input [type]="showCurrentPassword() ? 'text' : 'password'"
                                formControlName="currentPassword"
                                placeholder="••••••••">
                            <button type="button" class="toggle-eye" (click)="showCurrentPassword.update(v => !v)">
                                {{ showCurrentPassword() ? '🙈' : '👁️' }}
                            </button>
                        </div>
                        <div class="field-error" *ngIf="f['currentPassword'].invalid && f['currentPassword'].touched">
                            La contraseña actual es obligatoria.
                        </div>
                    </div>

                    <!-- Nueva contraseña -->
                    <div class="field-group">
                        <label>NUEVA CONTRASEÑA <span class="req">*</span></label>
                        <div class="input-wrapper">
                            <input [type]="showNewPassword() ? 'text' : 'password'"
                                formControlName="newPassword"
                                placeholder="Mínimo 8 caracteres">
                            <button type="button" class="toggle-eye" (click)="showNewPassword.update(v => !v)">
                                {{ showNewPassword() ? '🙈' : '👁️' }}
                            </button>
                        </div>
                        <!-- Errores granulares -->
                        <div class="field-error" *ngIf="f['newPassword'].invalid && f['newPassword'].touched">
                            <span *ngIf="f['newPassword'].errors?.['required']">La nueva contraseña es obligatoria.</span>
                            <span *ngIf="f['newPassword'].errors?.['minlength']">Mínimo 8 caracteres.</span>
                            <span *ngIf="f['newPassword'].errors?.['pattern']">
                                Debe contener al menos una mayúscula, una minúscula y un número.
                            </span>
                        </div>
                        <!-- Indicador de fortaleza -->
                        <div class="strength-bar" *ngIf="f['newPassword'].value">
                            <div class="strength-track">
                                <div class="strength-fill" [class]="strengthClass()"></div>
                            </div>
                            <span class="strength-label">{{ strengthLabel() }}</span>
                        </div>
                    </div>

                    <!-- Confirmar contraseña -->
                    <div class="field-group">
                        <label>CONFIRMAR CONTRASEÑA <span class="req">*</span></label>
                        <div class="input-wrapper">
                            <input [type]="showConfirmPassword() ? 'text' : 'password'"
                                formControlName="confirmPassword"
                                placeholder="Repita la nueva contraseña">
                            <button type="button" class="toggle-eye" (click)="showConfirmPassword.update(v => !v)">
                                {{ showConfirmPassword() ? '🙈' : '👁️' }}
                            </button>
                        </div>
                        <div class="field-error" *ngIf="f['confirmPassword'].touched && passwordForm.errors?.['mismatch']">
                            Las contraseñas no coinciden.
                        </div>
                    </div>

                    <!-- Requisitos -->
                    <div class="requirements">
                        <p class="req-title">La contraseña debe tener:</p>
                        <ul>
                            <li [class.ok]="hasMinLength()">✓ Mínimo 8 caracteres</li>
                            <li [class.ok]="hasUppercase()">✓ Al menos una mayúscula</li>
                            <li [class.ok]="hasLowercase()">✓ Al menos una minúscula</li>
                            <li [class.ok]="hasNumber()">✓ Al menos un número</li>
                        </ul>
                    </div>

                    <div class="field-error center" *ngIf="errorMessage()">{{ errorMessage() }}</div>

                    <button type="submit" class="btn-submit"
                            [disabled]="passwordForm.invalid || isSubmitting()">
                        {{ isSubmitting() ? 'Cambiando...' : 'Cambiar Contraseña' }}
                    </button>

                </form>
            </div>
        </div>
    `,
    styles: [`
    .change-password-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f1f5f9;
        padding: 1rem;
    }
    .cp-card {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        width: 100%;
        max-width: 440px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.10);
    }
    .cp-header h3 { font-size: 1.3rem; color: #1e3a6a; margin-bottom: 0.4rem; }
    .cp-header p  { font-size: 0.85rem; color: #64748b; margin-bottom: 1.5rem; }
    .field-group  { margin-bottom: 1.2rem; }
    label         { font-size: 0.72rem; font-weight: 700; color: #64748b;
                    letter-spacing: 0.05em; display: block; margin-bottom: 0.4rem; }
    .req          { color: #ef4444; }
    .input-wrapper { position: relative; }
    .input-wrapper input {
        width: 100%; padding: 0.65rem 2.5rem 0.65rem 0.85rem;
        border: 1.5px solid #e2e8f0; border-radius: 8px;
        font-size: 0.95rem; box-sizing: border-box; outline: none;
        transition: border-color 0.2s;
    }
    .input-wrapper input:focus { border-color: #1e3a6a; }
    .toggle-eye {
        position: absolute; right: 0.65rem; top: 50%;
        transform: translateY(-50%); background: none;
        border: none; cursor: pointer; font-size: 1rem; padding: 0;
    }
    .field-error  { font-size: 0.78rem; color: #ef4444; margin-top: 0.3rem; }
    .field-error.center { text-align: center; margin-bottom: 0.8rem; }

    /* Barra de fortaleza */
    .strength-bar   { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.4rem; }
    .strength-track { flex: 1; height: 5px; background: #e2e8f0; border-radius: 99px; overflow: hidden; }
    .strength-fill  { height: 100%; border-radius: 99px; transition: width 0.3s, background 0.3s; }
    .strength-fill.weak   { width: 33%; background: #ef4444; }
    .strength-fill.medium { width: 66%; background: #f59e0b; }
    .strength-fill.strong { width: 100%; background: #22c55e; }
    .strength-label { font-size: 0.72rem; color: #64748b; min-width: 50px; }

    /* Requisitos */
    .requirements { background: #f8fafc; border-radius: 8px; padding: 0.85rem 1rem; margin-bottom: 1.2rem; }
    .req-title    { font-size: 0.78rem; font-weight: 600; color: #475569; margin-bottom: 0.4rem; }
    .requirements ul { list-style: none; padding: 0; margin: 0; }
    .requirements li { font-size: 0.78rem; color: #94a3b8; padding: 0.15rem 0; transition: color 0.2s; }
    .requirements li.ok { color: #22c55e; font-weight: 500; }

    /* Botón */
    .btn-submit {
        width: 100%; padding: 0.8rem; background: #1e3a6a;
        color: white; border: none; border-radius: 8px;
        font-size: 0.95rem; font-weight: 600; cursor: pointer;
        transition: background 0.2s;
    }
    .btn-submit:hover:not(:disabled) { background: #16305a; }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
`]
})
export class ChangePasswordComponent {
    private fb = inject(FormBuilder);
    private auth = inject(AuthService);
    private router = inject(Router);
    private http = inject(HttpClient);

    passwordForm: FormGroup;
    isSubmitting = signal(false);
    errorMessage = signal('');
    showCurrentPassword = signal(false);
    showNewPassword = signal(false);
    showConfirmPassword = signal(false);

    private tempToken: string | null = null;
    private tempUser: any = null;

    constructor() {
        this.passwordForm = this.fb.group({
            currentPassword: ['', Validators.required],
            newPassword: ['', [
                Validators.required,
                Validators.minLength(8),
                Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
            ]],
            confirmPassword: ['', Validators.required]
        }, { validators: this.passwordsMatch });
    }

    // Getters para validar requisitos en tiempo real
    get newPass(): string { return this.f['newPassword'].value || ''; }
    hasMinLength()  { return this.newPass.length >= 8; }
    hasUppercase()  { return /[A-Z]/.test(this.newPass); }
    hasLowercase()  { return /[a-z]/.test(this.newPass); }
    hasNumber()     { return /\d/.test(this.newPass); }

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

        ngOnInit(): void {
        
        this.tempToken = this.auth.getTempToken();
        this.tempUser = this.auth.getTempUser();
        
        console.log('Token temporal:', this.tempToken);
        console.log('Usuario temporal:', this.tempUser);
        
        // Si no hay token temporal, redirigir al login
        if (!this.tempToken || !this.tempUser) {
            console.log('No hay sesión temporal, redirigiendo a login');
            this.router.navigate(['/login']);
            return;
        }
        
        // Inicializar formulario
        this.passwordForm = this.fb.group({
            currentPassword: ['', Validators.required],
            newPassword: ['', [Validators.required, Validators.minLength(8)]],
            confirmPassword: ['', Validators.required]
        }, { validators: this.passwordsMatch });
    }

    get f() {
        return this.passwordForm.controls;
    }

    passwordsMatch(group: FormGroup) {
        const newPass = group.get('newPassword')?.value;
        const confirmPass = group.get('confirmPassword')?.value;
        return newPass === confirmPass ? null : { mismatch: true };
    }

    onSubmit() {
        if (this.passwordForm.invalid) {
            this.passwordForm.markAllAsTouched();
            return;
        }

        this.isSubmitting.set(true);
        this.errorMessage.set('');

        
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${this.tempToken}`
        });

        this.http.post('http://localhost:3000/auth/change-password', {
            currentPassword: this.passwordForm.value.currentPassword,
            newPassword: this.passwordForm.value.newPassword
        }, { headers }).subscribe({
            next: (response: any) => {
                console.log('Contraseña cambiada exitosamente:', response);
                
            
                this.auth.completePasswordChange(this.tempToken!, this.tempUser);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Contraseña actualizada',
                    text: 'Tu contraseña ha sido cambiada exitosamente.',
                    confirmButtonText: 'Continuar',
                    confirmButtonColor: '#1e3a6a'
                }).then(() => {
                   
                    if (this.tempUser.role === 'doctor') {
                        this.router.navigate(['/doctor/dashboard']);
                    } else {
                        this.router.navigate(['/']);
                    }
                });
            },
            error: (err: any) => {
                console.error('Error al cambiar contraseña:', err);
                this.errorMessage.set(err.error?.message || 'Error al cambiar la contraseña');
                this.isSubmitting.set(false);
            }
        });
    }
}