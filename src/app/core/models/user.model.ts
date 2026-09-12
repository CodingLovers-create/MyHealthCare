export enum UserRole {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  HR = 'HR',
  PATIENT = 'PATIENT',
  PAYROLL_MANAGER = 'PAYROLL_MANAGER'
}

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  avatarUrl?: string;
  department?: string;
  createdAt: string;
}
