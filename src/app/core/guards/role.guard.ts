import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, UserRoleType } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/**
 * Functional Angular 18 Role & Permission Guard
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  const currentUser = authService.getCurrentUserValue();
  const allowedRoles = (route.data?.['roles'] as UserRoleType[]) || [];
  const requiredPermission = (route.data?.['permission'] as string) || '';

  // 1. Check if user is logged in
  if (!currentUser || !currentUser.username) {
    toastService.warning('Please sign in first.');
    return router.createUrlTree(['/login']);
  }

  // 2. Check role match if roles are specified
  const roleMatch = allowedRoles.length === 0 || allowedRoles.includes(currentUser.role);
  
  // 3. Check permission match if requiredPermission is specified
  const permissionMatch = !requiredPermission || authService.hasPermission(requiredPermission);

  if (roleMatch && permissionMatch) {
    return true;
  }

  toastService.error(`Access Denied: You do not have permission to access ${state.url}.`);

  // Redirect user to their designated role home route
  const fallbackRoute = currentUser.role === 'patient_executive' 
    ? '/doctor-appointment' 
    : currentUser.role === 'nurse'
    ? '/vitals-recording'
    : currentUser.role === 'doctor'
    ? '/doctor-patient-list'
    : '/dashboard';

  return router.createUrlTree([fallbackRoute]);
};
