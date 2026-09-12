import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

export type UserRoleType = 'admin' | 'patient_executive';

export interface UserProfile {
  name: string;
  roleTitle: string;
  avatar: string;
  role: UserRoleType;
  hospital: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private static readonly ADMIN_USER: UserProfile = {
    name: 'Rahul Yadav',
    roleTitle: 'Administrator',
    avatar: 'RY',
    role: 'admin',
    hospital: 'Reliance Foundation Hospital'
  };

  private static readonly EXECUTIVE_USER: UserProfile = {
    name: 'Priya Sharma',
    roleTitle: 'Patient Executive',
    avatar: 'PS',
    role: 'patient_executive',
    hospital: 'Reliance Foundation Hospital'
  };

  currentRole = signal<UserRoleType>(this.getStoredRole());

  currentUser = computed<UserProfile>(() => {
    return this.currentRole() === 'admin' ? AuthService.ADMIN_USER : AuthService.EXECUTIVE_USER;
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

  constructor(private router: Router) {}

  loginAs(role: UserRoleType): string {
    this.currentRole.set(role);
    localStorage.setItem('mhc_role', role);
    const targetRoute = role === 'patient_executive' ? '/doctor-appointment' : '/dashboard';
    return targetRoute;
  }

  logout(): void {
    this.router.navigate(['/login']);
  }

  private getStoredRole(): UserRoleType {
    const role = localStorage.getItem('mhc_role');
    return role === 'patient_executive' ? 'patient_executive' : 'admin';
  }
}
