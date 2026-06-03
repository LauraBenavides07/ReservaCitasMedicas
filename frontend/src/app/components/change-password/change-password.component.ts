import { Component, signal, inject, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ButtonComponent } from '../../shared/atoms/button/button.component';
import { FormFieldComponent } from '../../shared/atoms/form-field/form-field.component';
import { AlertComponent } from '../../shared/atoms/alert/alert.component';
import { CardComponent } from '../../shared/atoms/card/card.component';
import Swal from 'sweetalert2';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

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
    templateUrl: './change-password.component.html',
    styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit {
    @Output() onSuccess = new EventEmitter<void>();
    
    private fb = inject(FormBuilder);
    private auth = inject(AuthService);
    private router = inject(Router);
    private http = inject(HttpClient);

    passwordForm!: FormGroup;
    isSubmitting = signal(false);
    errorMessage = signal('');
    showCurrentPassword = signal(false);
    showNewPassword = signal(false);
    showConfirmPassword = signal(false);

    get f() {
        return this.passwordForm.controls;
    }

    get newPass(): string {
        return this.f['newPassword']?.value || '';
    }

    ngOnInit(): void {
        const tempToken = this.auth.getTempToken();
        const token = this.auth.getToken();
        
        if (!tempToken && !token) {
            console.log('No hay sesión, redirigiendo a login');
            this.router.navigate(['/']);
            return;
        }

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

    passwordsMatch(group: FormGroup) {
        const newPass = group.get('newPassword')?.value;
        const confirmPass = group.get('confirmPassword')?.value;
        return newPass === confirmPass ? null : { mismatch: true };
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

    onSubmit() {
        if (this.passwordForm.invalid) {
            this.passwordForm.markAllAsTouched();
            return;
        }

        this.isSubmitting.set(true);
        this.errorMessage.set('');

        const token = this.auth.getTempToken() || this.auth.getToken();
        
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });

        this.http.post(`${environment.apiUrl}/auth/change-password`, {
            currentPassword: this.passwordForm.value.currentPassword,
            newPassword: this.passwordForm.value.newPassword
        }, { headers }).subscribe({
            next: (response: any) => {
                console.log('Contraseña cambiada exitosamente:', response);
                
                if (this.auth.getTempToken()) {
                    const tempUser = this.auth.getTempUser();
                    this.auth.completePasswordChange(token!, tempUser!);
                }

                Swal.fire({
                    icon: 'success',
                    title: 'Contraseña actualizada',
                    text: 'Tu contraseña ha sido cambiada exitosamente.',
                    confirmButtonText: 'Continuar',
                    confirmButtonColor: '#1e3a6a'
                }).then(() => {
                    this.onSuccess.emit();
                    const user = this.auth.user();
                    if (user?.role === 'doctor') {
                        this.router.navigate(['/doctor/dashboard']);
                    } else if (user?.role === 'patient') {
                        this.router.navigate(['/patient/dashboard']);
                    } else {
                        this.router.navigate(['/appointments/list']);
                    }
                });
            },
            error: (err: any) => {
                console.error('Error al cambiar contraseña:', err);
                this.errorMessage.set(err.error?.message || 'Error al cambiar la contraseña. Verifica tu contraseña actual.');
                this.isSubmitting.set(false);
            }
        });
    }
}