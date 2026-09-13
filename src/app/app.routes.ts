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
  { path: 'op-billing', component: OpBillingComponent },
  { path: 'op-bill', component: OpBillingComponent },
  { path: 'forms', component: PatientRegistrationComponent },
  { path: 'form-master', component: PatientRegistrationComponent },
  { path: 'vitals-recording', component: VitalsRecordingComponent },
  { path: 'doctor-patient-list', component: DoctorPatientListComponent },
  { path: 'doctor-queue', component: DoctorPatientListComponent },
  { path: 'doctor-consultation/:uhid', component: DoctorConsultationComponent },
  { path: '**', redirectTo: 'dashboard' }
];


