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

  private static readonly ADMIN_USER: UserProfile = {
    id: '1',
    name: 'Mr. PRATHAMESH KHOCHADE',
    roleTitle: 'Administrator',
    avatar: 'PK',
    role: 'admin',
    hospital: 'Reliance Foundation Hospital',
    username: 'prathamesh',
    permissions: ['all']
  };

  private static readonly EXECUTIVE_USER: UserProfile = {
    id: '2',
    name: 'Priya Sharma',
    roleTitle: 'Patient Executive',
    avatar: 'PS',
    role: 'patient_executive',
    hospital: 'Reliance Foundation Hospital',
    username: 'priya',
    permissions: ['doctor_appointment', 'book_appointment']
  };

  private static readonly NURSE_USER: UserProfile = {
    id: '4',
    name: 'Kavita Rane',
    roleTitle: 'Staff Nurse',
    avatar: 'KR',
    role: 'nurse',
    hospital: 'Reliance Foundation Hospital',
    username: 'kavita',
    permissions: ['vitals']
  };

  private static readonly DOCTOR_USER: UserProfile = {
    id: '5',
    name: 'Dr. Susheel Bindroo',
    roleTitle: 'Consultant Physician',
    avatar: 'SB',
    role: 'doctor',
    hospital: 'Reliance Foundation Hospital',
    username: 'susheel',
    permissions: ['consultation', 'queue']
  };

  // BehaviorSubject holding the login user state
  private currentUserSubject = new BehaviorSubject<UserProfile>(this.getStoredUser());
  // Observable exposed to all components (Navbar, Worklist, Billing, Search, etc.)
  public currentUser$: Observable<UserProfile> = this.currentUserSubject.asObservable();

  currentRole = signal<UserRoleType>(this.currentUserSubject.value.role);
  activeUser = signal<UserProfile>(this.currentUserSubject.value);

  currentUser = computed<UserProfile>(() => this.activeUser());

  isAdmin = computed(() => this.currentRole() === 'admin');
  isPatientExecutive = computed(() => this.currentRole() === 'patient_executive');
  isNurse = computed(() => this.currentRole() === 'nurse');
  isDoctor = computed(() => this.currentRole() === 'doctor');

  // Dynamic API-driven allowed modules with fallback based on user role
  allowedModules = computed<ModuleAccess[]>(() => {
    const user = this.activeUser();
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
    if (!user || !user.permissions) return true;
    return user.permissions.includes('all') || user.permissions.includes(permission);
  }

  private static defaultProfileForRole(role: UserRoleType): UserProfile {
    switch (role) {
      case 'patient_executive': return AuthService.EXECUTIVE_USER;
      case 'nurse': return AuthService.NURSE_USER;
      case 'doctor': return AuthService.DOCTOR_USER;
      default: return AuthService.ADMIN_USER;
    }
  }

  private static routeForRole(role: UserRoleType): string {
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

        const fallbackProfile = AuthService.defaultProfileForRole(role);
        const profile: UserProfile = matchedUser ? {
          id: matchedUser.id,
          name: matchedUser.name || fallbackProfile.name,
          roleTitle: matchedUser.roleTitle || fallbackProfile.roleTitle,
          avatar: matchedUser.avatar || (matchedUser.name ? matchedUser.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : fallbackProfile.avatar),
          role,
          hospital: matchedUser.hospital || 'Reliance Foundation Hospital',
          username: matchedUser.username,
          permissions: matchedUser.permissions || fallbackProfile.permissions,
          allowedModules: matchedUser.allowedModules
        } : fallbackProfile;

        this.setSessionUser(profile);
        const targetRoute = AuthService.routeForRole(role);
        return { user: profile, targetRoute };
      }),
      catchError(() => {
        const fallbackRole = this.detectRoleFromIdentifier(cleanId);
        const fallbackUser = AuthService.defaultProfileForRole(fallbackRole);
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

  getCurrentUserValue(): UserProfile {
    return this.currentUserSubject.getValue();
  }

  loginAs(role: UserRoleType): string {
    const user = AuthService.defaultProfileForRole(role);
    this.setSessionUser(user);
    return AuthService.routeForRole(role);
  }

  logout(): void {
    localStorage.removeItem('mhc_user');
    this.router.navigate(['/login']);
  }

  private getStoredUser(): UserProfile {
    const stored = localStorage.getItem('mhc_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.name) return parsed;
      } catch (e) {}
    }
    const role = this.getStoredRole();
    return AuthService.defaultProfileForRole(role);
  }

  private getStoredRole(): UserRoleType {
    const role = localStorage.getItem('mhc_role');
    if (role === 'patient_executive' || role === 'nurse' || role === 'doctor') return role;
    return 'admin';
  }
}
