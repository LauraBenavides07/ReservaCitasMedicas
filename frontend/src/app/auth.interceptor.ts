import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Para change-password usar el token temporal si existe
  const isChangePassword = req.url.includes('/auth/change-password');
  const token = isChangePassword
    ? (authService.getTempToken() ?? authService.getToken())
    : authService.getToken();

  let request = req;
  if (token) {
    request = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // No cerrar sesión si estamos en change-password o en rutas auth
      if (
        error.status === 401 &&
        !req.url.includes('/auth/') &&
        !req.url.includes('/change-password')
      ) {
        console.warn('Sesión expirada (401). Cerrando sesión...');
        authService.logout();
        location.reload();
      }
      return throwError(() => error);
    })
  );
};