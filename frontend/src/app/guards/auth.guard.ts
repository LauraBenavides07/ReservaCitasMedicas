import { inject } from '@angular/core';
import { Router, type CanActivateFn, type ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.user();
  const requiredRole = route.data['role'] as string;

  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  if (requiredRole && user.role !== requiredRole) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};
