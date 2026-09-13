import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export type UserRoleType = 'admin' | 'patient_executive' | 'nurse' | 'doctor';

export interface ModuleAccess {
  id: string;
  label: string;
  route: string;
}

export interface UserProfile {
  id?: string;
  name: string;
  roleTitle: string;
  avatar: string;
  role: UserRoleType;
  hospital: string;
  username?: string;
  permissions?: string[];
  allowedModules?: ModuleAccess[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiService = inject(ApiService);
  private router = inject(Router);

  // BehaviorSubject holding the login user state (null if unauthenticated)
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(this.getStoredUser());
  // Observable exposed to all components (Navbar, Worklist, Billing, Search, etc.)
  public currentUser$: Observable<UserProfile | null> = this.currentUserSubject.asObservable();

  currentRole = signal<UserRoleType | null>(this.currentUserSubject.value ? this.currentUserSubject.value.role : null);
  activeUser = signal<UserProfile | null>(this.currentUserSubject.value);

  currentUser = computed<UserProfile | null>(() => this.activeUser());
  isLoggedIn = computed<boolean>(() => !!this.activeUser() && !!this.activeUser()?.username);

  isAdmin = computed(() => this.currentRole() === 'admin');
  isPatientExecutive = computed(() => this.currentRole() === 'patient_executive');
  isNurse = computed(() => this.currentRole() === 'nurse');
  isDoctor = computed(() => this.currentRole() === 'doctor');

  // Dynamic API-driven allowed modules with fallback based on user role
  allowedModules = computed<ModuleAccess[]>(() => {
    const user = this.activeUser();
    if (!user) return [];
    if (user.allowedModules && user.allowedModules.length > 0) {
      return user.allowedModules;
    }
    if (user.role === 'patient_executive') {
      return [
        { id: 'DoctorAppointment', label: 'Doctor Appointment', route: '/doctor-appointment' }
      ];
    }
    if (user.role === 'nurse') {
      return [
        { id: 'VitalsRecording', label: 'Vitals Recording', route: '/vitals-recording' }
      ];
    }
    if (user.role === 'doctor') {
      return [
        { id: 'DoctorPatientList', label: 'OPD Queue', route: '/doctor-patient-list' }
      ];
    }
    return [
      { id: 'MyDesk', label: 'MyDesk', route: '/dashboard' },
      { id: 'MagicSearch', label: 'MagicSearch', route: '/magic-search' },
      { id: 'Registration', label: 'Patient Registration', route: '/registration' },
      { id: 'DoctorAppointment', label: 'Doctor Appointment', route: '/doctor-appointment' },
      { id: 'OpBilling', label: 'OP Billing & Cashier', route: '/op-billing' },
      { id: 'VitalsRecording', label: 'Vitals Recording', route: '/vitals-recording' },
      { id: 'DoctorPatientList', label: 'OPD Queue', route: '/doctor-patient-list' }
    ];
  });

  /**
   * Helper method to check if current logged in user has specific API permission
   */
  hasPermission(permission: string): boolean {
    const user = this.activeUser();
    if (!user || !user.permissions) return false;
    return user.permissions.includes('all') || user.permissions.includes(permission);
  }

  static routeForRole(role: UserRoleType): string {
    switch (role) {
      case 'patient_executive': return '/doctor-appointment';
      case 'nurse': return '/vitals-recording';
      case 'doctor': return '/doctor-patient-list';
      default: return '/dashboard';
    }
  }

  private detectRoleFromIdentifier(cleanId: string): UserRoleType {
    if (cleanId.includes('executive') || cleanId.includes('priya') || cleanId.includes('patient') || cleanId.includes('booking') || cleanId === 'pe') {
      return 'patient_executive';
    }
    if (cleanId.includes('nurse') || cleanId.includes('kavita') || cleanId === 'nu') {
      return 'nurse';
    }
    if (cleanId.includes('doctor') || cleanId.includes('susheel') || cleanId.includes('dr') || cleanId === 'doc') {
      return 'doctor';
    }
    return 'admin';
  }

  authenticateUser(identifier: string): Observable<{ user: UserProfile; targetRoute: string }> {
    const cleanId = (identifier || '').toLowerCase().trim();
    return this.apiService.get<any[]>('users').pipe(
      map(users => {
        const matchedUser = Array.isArray(users) ? users.find(u => u.username?.toLowerCase() === cleanId || u.name?.toLowerCase().includes(cleanId)) : null;

        let role: UserRoleType = this.detectRoleFromIdentifier(cleanId);
        if (matchedUser?.role === 'patient_executive' || matchedUser?.role === 'nurse' || matchedUser?.role === 'doctor' || matchedUser?.role === 'admin') {
          role = matchedUser.role;
        }

        const profileName = matchedUser?.name || (cleanId ? (cleanId.charAt(0).toUpperCase() + cleanId.slice(1)) : 'Mr. PRATHAMESH KHOCHADE');
        const roleTitle = matchedUser?.roleTitle || (role === 'admin' ? 'Administrator' : role === 'nurse' ? 'Staff Nurse' : role === 'doctor' ? 'Consultant Physician' : 'Patient Executive');
        const avatarInitials = matchedUser?.avatar || (profileName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'PK');

        const profile: UserProfile = {
          id: matchedUser ? matchedUser.id : 'user-' + Math.floor(100 + Math.random() * 900),
          name: profileName,
          roleTitle: roleTitle,
          avatar: avatarInitials,
          role: role,
          hospital: matchedUser?.hospital || 'Reliance Foundation Hospital',
          username: matchedUser ? matchedUser.username : cleanId,
          permissions: matchedUser?.permissions || (role === 'admin' ? ['all'] : [role]),
          allowedModules: matchedUser?.allowedModules
        };

        this.setSessionUser(profile);
        const targetRoute = AuthService.routeForRole(role);
        return { user: profile, targetRoute };
      }),
      catchError(() => {
        const fallbackRole = this.detectRoleFromIdentifier(cleanId);
        const fallbackUser: UserProfile = {
          id: '1',
          name: cleanId ? (cleanId.charAt(0).toUpperCase() + cleanId.slice(1)) : 'Mr. PRATHAMESH KHOCHADE',
          roleTitle: fallbackRole === 'admin' ? 'Administrator' : 'Staff User',
          avatar: 'PK',
          role: fallbackRole,
          hospital: 'Reliance Foundation Hospital',
          username: cleanId || 'prathamesh',
          permissions: ['all']
        };
        this.setSessionUser(fallbackUser);
        return of({ user: fallbackUser, targetRoute: AuthService.routeForRole(fallbackRole) });
      })
    );
  }

  setSessionUser(user: UserProfile): void {
    this.currentRole.set(user.role);
    this.activeUser.set(user);
    this.currentUserSubject.next(user);
    localStorage.setItem('mhc_role', user.role);
    localStorage.setItem('mhc_user', JSON.stringify(user));
  }

  getCurrentUserValue(): UserProfile | null {
    return this.currentUserSubject.getValue();
  }

  loginAs(role: UserRoleType): string {
    const targetUsername = role === 'patient_executive' ? 'priya' : role === 'nurse' ? 'kavita' : role === 'doctor' ? 'susheel' : 'prathamesh';
    this.authenticateUser(targetUsername).subscribe();
    return AuthService.routeForRole(role);
  }

  logout(): void {
    localStorage.removeItem('mhc_user');
    localStorage.removeItem('mhc_role');
    this.currentRole.set(null);
    this.activeUser.set(null);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  private getStoredUser(): UserProfile | null {
    const stored = localStorage.getItem('mhc_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.name && parsed.username) return parsed;
      } catch (e) {}
    }
    return null; // Pure unauthenticated state when no user in localStorage
  }
}
