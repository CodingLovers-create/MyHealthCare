import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { PatientRegistrationComponent } from './features/patient-registration/patient-registration.component';
import { MagicSearchComponent } from './features/magic-search/magic-search.component';
import { DoctorAppointmentComponent } from './features/doctor-appointment/doctor-appointment.component';
import { VitalsRecordingComponent } from './features/vitals-recording/vitals-recording.component';
import { DoctorPatientListComponent } from './features/doctor-patient-list/doctor-patient-list.component';
import { DoctorConsultationComponent } from './features/doctor-consultation/doctor-consultation.component';
import { OpBillingComponent } from './features/op-billing/op-billing.component';
import { MedicalRecordsComponent } from './features/medical-records/medical-records.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard, roleGuard], data: { roles: ['admin'] } },
  { path: 'magic-search', component: MagicSearchComponent, canActivate: [authGuard, roleGuard], data: { roles: ['admin'] } },
  { path: 'doctor-appointment', component: DoctorAppointmentComponent, canActivate: [authGuard, roleGuard], data: { roles: ['admin', 'patient_executive'] } },
  { path: 'appointment', redirectTo: 'doctor-appointment', pathMatch: 'full' },
  { path: 'appointments', redirectTo: 'doctor-appointment', pathMatch: 'full' },
  { path: 'doctor-appointments', redirectTo: 'doctor-appointment', pathMatch: 'full' },
  { path: 'manage-doctors', redirectTo: 'doctor-appointment', pathMatch: 'full' },
  { path: 'manage-appointment', redirectTo: 'doctor-appointment', pathMatch: 'full' },
  { path: 'registration', component: PatientRegistrationComponent, canActivate: [authGuard, roleGuard], data: { roles: ['admin'] } },
  { path: 'patient-registration', redirectTo: 'registration', pathMatch: 'full' },
  { path: 'forms', redirectTo: 'registration', pathMatch: 'full' },
  { path: 'form-master', redirectTo: 'registration', pathMatch: 'full' },
  { path: 'op-billing', component: OpBillingComponent, canActivate: [authGuard, roleGuard], data: { roles: ['admin'] } },
  { path: 'op-bill', redirectTo: 'op-billing', pathMatch: 'full' },
  { path: 'vitals-recording', component: VitalsRecordingComponent, canActivate: [authGuard, roleGuard], data: { roles: ['admin', 'nurse'] } },
  { path: 'doctor-patient-list', component: DoctorPatientListComponent, canActivate: [authGuard, roleGuard], data: { roles: ['doctor'] } },
  { path: 'doctor-queue', redirectTo: 'doctor-patient-list', pathMatch: 'full' },
  { path: 'doctor-consultation/:uhid', component: DoctorConsultationComponent, canActivate: [authGuard, roleGuard], data: { roles: ['doctor'] } },
  { path: 'medical-records', component: MedicalRecordsComponent, canActivate: [authGuard, roleGuard], data: { roles: ['admin', 'doctor', 'nurse', 'patient_executive'] } },
  { path: '**', redirectTo: 'dashboard' }
];
