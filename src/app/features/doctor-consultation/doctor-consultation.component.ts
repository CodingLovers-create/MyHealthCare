import { Component, signal, computed, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { ToastService } from '../../core/services/toast.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { AuthService } from '../../core/services/auth.service';
import { OpdQueueService } from '../../core/services/opd-queue.service';
import { MedicalRecordsService } from '../../core/services/medical-records.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { PrescriptionItem } from '../../core/models/opd-queue.model';
import { Visit } from '../../core/models/visit.model';
import { classifyVital, statusDotClass, statusTextClass, statusLabel, VITAL_RANGES } from '../../core/utils/vital-status.util';

@Component({
  selector: 'app-doctor-consultation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './doctor-consultation.component.html'
})
export class DoctorConsultationComponent {
  activeModuleTab = signal<string>('DoctorPatientList');
  uhid = signal<string>('');

  complaints = signal<string>('');
  clinicalFindings = signal<string>('');
  diagnosis = signal<string>('');
  prescription = signal<PrescriptionItem[]>([]);

  newMedicine = signal<string>('');
  newDosage = signal<string>('');
  newFrequency = signal<string>('');
  newDuration = signal<string>('');
  newInstructions = signal<string>('');

  medicineNameInput = viewChild<ElementRef<HTMLInputElement>>('medicineNameInput');

  showSummaryModal = signal<boolean>(false);

  moduleTabs = computed(() => this.authService.allowedModules());

  patient = computed(() => this.queueService.getPatient(this.uhid()));

  dotClassFor = statusDotClass;
  textClassFor = statusTextClass;
  labelFor = statusLabel;

  vitalStatus(value: string, key: keyof typeof VITAL_RANGES) {
    return classifyVital(value, VITAL_RANGES[key]);
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService,
    public sidebarService: SidebarService,
    public authService: AuthService,
    public queueService: OpdQueueService,
    private medicalRecordsService: MedicalRecordsService
  ) {
    if (!this.authService.isDoctor()) {
      this.toastService.warning('This screen is restricted to doctors.');
      const role = this.authService.currentRole() || 'admin';
      this.router.navigate([this.authService.loginAs(role)]);
      return;
    }

    const paramUhid = this.route.snapshot.paramMap.get('uhid') || '';
    this.uhid.set(paramUhid);

    const existing = this.queueService.getPatient(paramUhid);
    if (!existing) {
      this.toastService.error('Patient record not found in the OPD queue.');
      this.router.navigate(['/doctor-patient-list']);
      return;
    }

    this.complaints.set(existing.complaints);
    this.clinicalFindings.set(existing.clinicalFindings);
    this.diagnosis.set(existing.diagnosis);
    this.prescription.set(existing.prescription);
  }

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  selectModuleTab(tabId: string): void {
    this.activeModuleTab.set(tabId);
    if (tabId === 'MyDesk') {
      this.router.navigate(['/dashboard']);
    } else if (tabId === 'MagicSearch') {
      this.router.navigate(['/magic-search']);
    } else if (tabId === 'Registration') {
      this.router.navigate(['/registration']);
    } else if (tabId === 'DoctorAppointment') {
      this.router.navigate(['/doctor-appointment']);
    } else if (tabId === 'VitalsRecording') {
      this.router.navigate(['/vitals-recording']);
    } else if (tabId === 'DoctorPatientList') {
      this.router.navigate(['/doctor-patient-list']);
    } else if (tabId === 'MedicalRecords') {
      this.router.navigate(['/medical-records']);
    }
  }

  addMedicine(): void {
    if (!this.newMedicine().trim()) {
      this.toastService.warning('Please enter a medicine name.');
      return;
    }
    const item: PrescriptionItem = {
      id: 'p' + Date.now(),
      medicine: this.newMedicine(),
      dosage: this.newDosage(),
      frequency: this.newFrequency(),
      duration: this.newDuration(),
      instructions: this.newInstructions()
    };
    this.prescription.update(list => [...list, item]);
    this.newMedicine.set('');
    this.newDosage.set('');
    this.newFrequency.set('');
    this.newDuration.set('');
    this.newInstructions.set('');
    this.medicineNameInput()?.nativeElement.focus();
  }

  removeMedicine(id: string): void {
    this.prescription.update(list => list.filter(p => p.id !== id));
  }

  saveDraft(): void {
    this.queueService.updateConsultation(this.uhid(), {
      complaints: this.complaints(),
      clinicalFindings: this.clinicalFindings(),
      diagnosis: this.diagnosis(),
      prescription: this.prescription()
    });
    this.toastService.success('Consultation notes saved as draft.');
  }

  completeConsultation(): void {
    if (!this.complaints().trim() || !this.diagnosis().trim()) {
      this.toastService.warning('Please record presenting complaints and diagnosis before completing.');
      return;
    }
    const consultationData = {
      complaints: this.complaints(),
      clinicalFindings: this.clinicalFindings(),
      diagnosis: this.diagnosis(),
      prescription: this.prescription(),
      doctorName: this.authService.currentUser()?.name
    };
    this.queueService.updateConsultation(this.uhid(), consultationData);
    this.queueService.completeConsultation(this.uhid());

    const completedPatient = this.queueService.getPatient(this.uhid());
    if (completedPatient) {
      const visit: Visit = {
        visitId: 'OPV-2026-' + Math.floor(10000 + Math.random() * 90000),
        uhid: completedPatient.uhid,
        patientName: completedPatient.name,
        ageGender: completedPatient.ageGender,
        mobile: completedPatient.mobile,
        visitDate: new Date().toLocaleDateString('en-IN'),
        visitTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        doctorName: completedPatient.doctorName,
        department: completedPatient.department,
        complaints: completedPatient.complaints,
        clinicalFindings: completedPatient.clinicalFindings,
        diagnosis: completedPatient.diagnosis,
        prescription: completedPatient.prescription
      };
      this.medicalRecordsService.saveVisit(visit).subscribe();
    }

    this.showSummaryModal.set(true);
    this.toastService.success('Consultation completed. Review and print the summary.');
  }

  printConsultation(): void {
    window.print();
  }

  closeSummary(): void {
    this.showSummaryModal.set(false);
    this.router.navigate(['/doctor-patient-list']);
  }

  logout(): void {
    this.toastService.info('Logged out successfully.');
    this.router.navigate(['/login']);
  }

  openHelp(): void {
    this.toastService.info('Consultation & EMR Help & Guidelines opening...');
  }
}
