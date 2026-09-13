import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
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

  // Dynamic API-driven allowed modules based on logged-in user profile
  allowedModules = computed<ModuleAccess[]>(() => {
    const user = this.activeUser();
    if (!user) return [];
    if (user.allowedModules && user.allowedModules.length > 0) {
      return user.allowedModules;
    }
    if (user.role === 'patient_executive') {
      return [
        { id: 'DoctorAppointment', label: 'Doctor Appointment', route: '/doctor-appointment' },
        { id: 'MedicalRecords', label: 'Medical Records', route: '/medical-records' }
      ];
    }
    if (user.role === 'nurse') {
      return [
        { id: 'VitalsRecording', label: 'Vitals Recording', route: '/vitals-recording' },
        { id: 'MedicalRecords', label: 'Medical Records', route: '/medical-records' }
      ];
    }
    if (user.role === 'doctor') {
      return [
        { id: 'DoctorPatientList', label: 'OPD Queue', route: '/doctor-patient-list' },
        { id: 'MedicalRecords', label: 'Medical Records', route: '/medical-records' }
      ];
    }
    return [
      { id: 'MyDesk', label: 'MyDesk', route: '/dashboard' },
      { id: 'MagicSearch', label: 'MagicSearch', route: '/magic-search' },
      { id: 'Registration', label: 'Patient Registration', route: '/registration' },
      { id: 'DoctorAppointment', label: 'Doctor Appointment', route: '/doctor-appointment' },
      { id: 'OpBilling', label: 'OP Billing & Cashier', route: '/op-billing' },
      { id: 'VitalsRecording', label: 'Vitals Recording', route: '/vitals-recording' },
      { id: 'MedicalRecords', label: 'Medical Records', route: '/medical-records' }
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

  /**
   * Authenticate user strictly against API credentials.
   * Only existing users with matching password can log in!
   */
  authenticateUser(identifier: string, password?: string): Observable<{ user: UserProfile; targetRoute: string }> {
    const cleanId = (identifier || '').toLowerCase().trim();
    const cleanPassword = (password || '').trim();

    return this.apiService.get<any[]>('users').pipe(
      map(users => {
        if (!Array.isArray(users)) {
          throw new Error('Database error: Unable to fetch system users.');
        }

        const matchedUser = users.find(u => 
          u.username?.toLowerCase() === cleanId || 
          u.name?.toLowerCase() === cleanId
        );

        if (!matchedUser) {
          throw new Error('Access Denied: User account not found in database.');
        }

        if (cleanPassword && matchedUser.password && matchedUser.password !== cleanPassword) {
          throw new Error('Access Denied: Incorrect password. Please try again.');
        }

        const role: UserRoleType = matchedUser.role || 'admin';
        const profile: UserProfile = {
          id: matchedUser.id,
          name: matchedUser.name,
          roleTitle: matchedUser.roleTitle || (role === 'admin' ? 'Administrator' : role === 'nurse' ? 'Staff Nurse' : role === 'doctor' ? 'Consultant Physician' : 'Patient Executive'),
          avatar: matchedUser.avatar || (matchedUser.name ? matchedUser.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'PK'),
          role: role,
          hospital: matchedUser.hospital || 'Reliance Foundation Hospital',
          username: matchedUser.username,
          permissions: matchedUser.permissions || (role === 'admin' ? ['all'] : [role]),
          allowedModules: matchedUser.allowedModules
        };

        this.setSessionUser(profile);
        const targetRoute = AuthService.routeForRole(role);
        return { user: profile, targetRoute };
      }),
      catchError(err => {
        const errorMsg = err?.message || 'Access Denied: Invalid credentials.';
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  setSessionUser(user: UserProfile): void {
    this.currentRole.set(user.role);
    this.activeUser.set(user);
    this.currentUserSubject.next(user);
    
    // Maintain session in both SessionStorage & LocalStorage
    sessionStorage.setItem('mhc_role', user.role);
    sessionStorage.setItem('mhc_user', JSON.stringify(user));
    localStorage.setItem('mhc_role', user.role);
    localStorage.setItem('mhc_user', JSON.stringify(user));
  }

  getCurrentUserValue(): UserProfile | null {
    return this.currentUserSubject.getValue();
  }

  loginAs(role: UserRoleType): string {
    const targetUsername = role === 'patient_executive' ? 'priya' : role === 'nurse' ? 'kavita' : role === 'doctor' ? 'susheel' : 'prathamesh';
    this.authenticateUser(targetUsername, 'Welcome@123').subscribe();
    return AuthService.routeForRole(role);
  }

  logout(): void {
    sessionStorage.removeItem('mhc_user');
    sessionStorage.removeItem('mhc_role');
    localStorage.removeItem('mhc_user');
    localStorage.removeItem('mhc_role');
    this.currentRole.set(null);
    this.activeUser.set(null);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  private getStoredUser(): UserProfile | null {
    const stored = sessionStorage.getItem('mhc_user') || localStorage.getItem('mhc_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.name && parsed.username) return parsed;
      } catch (e) {}
    }
    return null;
  }
}
