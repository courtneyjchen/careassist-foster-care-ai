import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Guard that blocks foster_parent role from accessing social-worker–only pages.
 * Redirects them to the home dashboard.
 */
export const workerOnlyGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const role = auth.getUserRole();

  if (role === 'foster_parent' || role === 'aged_out_youth') {
    router.navigate(['/']);
    return false;
  }
  return true;
};
