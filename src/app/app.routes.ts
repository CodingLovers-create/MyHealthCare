import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { PatientRegistrationComponent } from './features/patient-registration/patient-registration.component';
import { MagicSearchComponent } from './features/magic-search/magic-search.component';
import { DoctorAppointmentComponent } from './features/doctor-appointment/doctor-appointment.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'magic-search', component: MagicSearchComponent },
  { path: 'appointment', component: DoctorAppointmentComponent },
  { path: 'appointments', component: DoctorAppointmentComponent },
  { path: 'doctor-appointment', component: DoctorAppointmentComponent },
  { path: 'doctor-appointments', component: DoctorAppointmentComponent },
  { path: 'manage-doctors', component: DoctorAppointmentComponent },
  { path: 'manage-appointment', component: DoctorAppointmentComponent },
  { path: 'registration', component: PatientRegistrationComponent },
  { path: 'patient-registration', component: PatientRegistrationComponent },
  { path: 'op-bill', component: PatientRegistrationComponent },
  { path: 'forms', component: PatientRegistrationComponent },
  { path: 'form-master', component: PatientRegistrationComponent },
  { path: '**', redirectTo: 'dashboard' }
];


