import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export type UserRoleType = 'admin' | 'patient_executive';

export interface UserProfile {
  id?: string;
  name: string;
  roleTitle: string;
  avatar: string;
  role: UserRoleType;
  hospital: string;
  username?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiService = inject(ApiService);
  private router = inject(Router);

  private static readonly ADMIN_USER: UserProfile = {
    id: '1',
    name: 'Rahul Yadav',
    roleTitle: 'Administrator',
    avatar: 'RY',
    role: 'admin',
    hospital: 'Reliance Foundation Hospital',
    username: 'rahul'
  };

  private static readonly EXECUTIVE_USER: UserProfile = {
    id: '2',
    name: 'Priya Sharma',
    roleTitle: 'Patient Executive',
    avatar: 'PS',
    role: 'patient_executive',
    hospital: 'Reliance Foundation Hospital',
    username: 'priya'
  };

  currentRole = signal<UserRoleType>(this.getStoredRole());
  activeUser = signal<UserProfile>(this.getStoredRole() === 'patient_executive' ? AuthService.EXECUTIVE_USER : AuthService.ADMIN_USER);

  currentUser = computed<UserProfile>(() => {
    return this.activeUser();
  });

  isAdmin = computed(() => this.currentRole() === 'admin');
  isPatientExecutive = computed(() => this.currentRole() === 'patient_executive');

  allowedModules = computed(() => {
    if (this.currentRole() === 'patient_executive') {
      return [
        { id: 'DoctorAppointment', label: 'Doctor Appointment', route: '/doctor-appointment' }
      ];
    }
    return [
      { id: 'MyDesk', label: 'MyDesk', route: '/dashboard' },
      { id: 'MagicSearch', label: 'MagicSearch', route: '/magic-search' },
      { id: 'Registration', label: 'Patient Registration', route: '/registration' },
      { id: 'DoctorAppointment', label: 'Doctor Appointment', route: '/doctor-appointment' }
    ];
  });

  authenticateUser(identifier: string): Observable<{ user: UserProfile; targetRoute: string }> {
    const cleanId = (identifier || '').toLowerCase().trim();
    return this.apiService.get<any[]>('users').pipe(
      map(users => {
        let matchedUser = Array.isArray(users) ? users.find(u => u.username?.toLowerCase() === cleanId || u.name?.toLowerCase().includes(cleanId)) : null;
        let role: UserRoleType = 'admin';

        if (matchedUser) {
          role = matchedUser.role === 'patient_executive' ? 'patient_executive' : 'admin';
        } else if (cleanId.includes('executive') || cleanId.includes('priya') || cleanId.includes('patient') || cleanId.includes('booking') || cleanId === 'pe') {
          role = 'patient_executive';
        }

        const profile: UserProfile = matchedUser ? {
          id: matchedUser.id,
          name: matchedUser.name || (role === 'admin' ? 'Rahul Yadav' : 'Priya Sharma'),
          roleTitle: matchedUser.roleTitle || (role === 'admin' ? 'Administrator' : 'Patient Executive'),
          avatar: matchedUser.name ? matchedUser.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : (role === 'admin' ? 'RY' : 'PS'),
          role: role,
          hospital: 'Reliance Foundation Hospital',
          username: matchedUser.username
        } : (role === 'patient_executive' ? AuthService.EXECUTIVE_USER : AuthService.ADMIN_USER);

        this.setSessionUser(profile);
        const targetRoute = role === 'patient_executive' ? '/doctor-appointment' : '/dashboard';
        return { user: profile, targetRoute };
      }),
      catchError(() => {
        const fallbackRole: UserRoleType = (cleanId.includes('executive') || cleanId.includes('priya')) ? 'patient_executive' : 'admin';
        const fallbackUser = fallbackRole === 'patient_executive' ? AuthService.EXECUTIVE_USER : AuthService.ADMIN_USER;
        this.setSessionUser(fallbackUser);
        const targetRoute = fallbackRole === 'patient_executive' ? '/doctor-appointment' : '/dashboard';
        return of({ user: fallbackUser, targetRoute });
      })
    );
  }

  setSessionUser(user: UserProfile): void {
    this.currentRole.set(user.role);
    this.activeUser.set(user);
    localStorage.setItem('mhc_role', user.role);
    localStorage.setItem('mhc_user', JSON.stringify(user));
  }

  loginAs(role: UserRoleType): string {
    const user = role === 'patient_executive' ? AuthService.EXECUTIVE_USER : AuthService.ADMIN_USER;
    this.setSessionUser(user);
    return role === 'patient_executive' ? '/doctor-appointment' : '/dashboard';
  }

  logout(): void {
    localStorage.removeItem('mhc_user');
    this.router.navigate(['/login']);
  }

  private getStoredRole(): UserRoleType {
    const role = localStorage.getItem('mhc_role');
    return role === 'patient_executive' ? 'patient_executive' : 'admin';
  }
}
