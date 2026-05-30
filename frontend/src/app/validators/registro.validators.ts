import { AbstractControl, ValidationErrors, ValidatorFn, AsyncValidatorFn } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { debounceTime, switchMap } from 'rxjs/operators';

// ============================================================
// VALIDADOR SÍNCRONO PERSONALIZADO
// Verifica que el documento tenga entre 6 y 10 dígitos numéricos
// Retorna null si es válido, o { documentoInvalido: true } si no
// ============================================================
export function validarFormatoDocumento(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;

    // Si el campo está vacío, no validamos (required se encarga)
    if (!valor) return null;

    // Expresión regular: solo dígitos, entre 6 y 10 caracteres
    const valido = /^\d{6,10}$/.test(valor);
    return valido ? null : { documentoInvalido: true };
  };
}

// ============================================================
// VALIDADOR ASÍNCRONO PERSONALIZADO
// Llama al backend para verificar si el documento ya está registrado
// Retorna null si no existe, o { documentoDuplicado: true } si ya existe
// ============================================================
export function documentoDuplicadoValidator(http: HttpClient): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
        if (!control.value || control.value.length < 6) {
            return of(null);  // No validar si no tiene mínimo 6 dígitos
        }
        
       
        return timer(500).pipe(
            switchMap(() => {
                return http.get<boolean>(`http://localhost:3000/auth/existe-documento/${control.value}`).pipe(
                    map((existe) => (existe ? { documentoDuplicado: true } : null)),
                    catchError(() => of(null))
                );
            })
        );
    };
}


  // ============================================================
  // VALIDADOR SÍNCRONO PARA EMAIL CON DOMINIOS ACEPTADOS
  // Valida formato básico y dominios permitidos: @unicauca.edu o @gmail.com
  // Retorna null si es válido, o { invalidEmailFormat: true } / { invalidEmailDomain: true }
  // ============================================================
  export function validarEmailDominio(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const valor = control.value;
      if (!valor) return null;

      const texto = String(valor).trim();

      // Validación básica de formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(texto)) {
        return { invalidEmailFormat: true };
      }

      // Validar dominio permitido
      const lower = texto.toLowerCase();
      const allowed = ['@unicauca.edu.co', '@gmail.com', '@hotmail.com', '@outlook.com'];
      const ok = allowed.some(d => lower.endsWith(d));
      return ok ? null : { invalidEmailDomain: true };
    };
  }

// Validador asíncrono para email duplicado
export function emailDuplicadoValidator(http: HttpClient): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
        if (!control.value || control.value.length < 5 || control.invalid) {
            return of(null);
        }
        
        const email = control.value.toLowerCase().trim();
        
        return timer(800).pipe(  // Delay para no llamar en cada tecla
            switchMap(() => {
                return http.get<boolean>(`http://localhost:3000/auth/existe-email/${encodeURIComponent(email)}`).pipe(
                    map((existe) => (existe ? { emailDuplicado: true } : null)),
                    catchError(() => of(null))
                );
            })
        );
    };
}