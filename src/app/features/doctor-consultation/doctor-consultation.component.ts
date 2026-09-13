import { Component, signal, computed, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { ToastService } from '../../core/services/toast.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { AuthService } from '../../core/services/auth.service';
import { OpdQueueService } from '../../core/services/opd-queue.service';
import { PrescriptionItem } from '../../core/models/opd-queue.model';
import { classifyVital, statusDotClass, statusTextClass, statusLabel, VITAL_RANGES } from '../../core/utils/vital-status.util';

@Component({
  selector: 'app-doctor-consultation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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
    public queueService: OpdQueueService
  ) {
    if (this.authService.isPatientExecutive() || this.authService.isNurse()) {
      this.toastService.warning('This screen is restricted to doctors.');
      this.router.navigate([this.authService.loginAs(this.authService.currentRole())]);
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
    this.queueService.updateConsultation(this.uhid(), {
      complaints: this.complaints(),
      clinicalFindings: this.clinicalFindings(),
      diagnosis: this.diagnosis(),
      prescription: this.prescription()
    });
    this.queueService.completeConsultation(this.uhid());
    this.toastService.success('Consultation completed and prescription generated.');
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
