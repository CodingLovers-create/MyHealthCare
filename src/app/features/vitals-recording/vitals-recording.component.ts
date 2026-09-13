import { Component, signal, computed, viewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { ToastService } from '../../core/services/toast.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { AuthService } from '../../core/services/auth.service';
import { OpdQueueService } from '../../core/services/opd-queue.service';
import { Vitals } from '../../core/models/opd-queue.model';
import {
  classifyVital,
  statusBorderClass,
  statusDotClass,
  statusTextClass,
  statusLabel,
  VITAL_RANGES,
  VitalStatus
} from '../../core/utils/vital-status.util';

@Component({
  selector: 'app-vitals-recording',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './vitals-recording.component.html'
})
export class VitalsRecordingComponent {
  activeModuleTab = signal<string>('VitalsRecording');
  searchQuery = signal<string>('');
  selectedUhid = signal<string | null>(null);
  alertDismissed = signal<boolean>(false);

  weightInput = viewChild<ElementRef<HTMLInputElement>>('weightInput');

  // Expose the pure util functions as instance members so the template can call them.
  borderClassFor = statusBorderClass;
  dotClassFor = statusDotClass;
  textClassFor = statusTextClass;
  labelFor = statusLabel;

  weight = signal<string>('');
  height = signal<string>('');
  waistCircumference = signal<string>('');
  bpSystolic = signal<string>('');
  bpDiastolic = signal<string>('');
  pulse = signal<string>('');
  temperature = signal<string>('');
  spo2 = signal<string>('');
  respiratoryRate = signal<string>('');
  bloodGlucose = signal<string>('');
  painScore = signal<string>('');

  moduleTabs = computed(() => this.authService.allowedModules());

  queue = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.queueService.patients();
    if (!q) return list;
    return list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.uhid.toLowerCase().includes(q) ||
      p.tokenNo.toLowerCase().includes(q)
    );
  });

  selectedPatient = computed(() => {
    const uhid = this.selectedUhid();
    return uhid ? this.queueService.getPatient(uhid) : undefined;
  });

  bmi = computed(() => {
    const w = parseFloat(this.weight());
    const h = parseFloat(this.height());
    if (!w || !h) return '';
    const heightInMeters = h / 100;
    return (w / (heightInMeters * heightInMeters)).toFixed(1);
  });

  map = computed(() => {
    const s = parseFloat(this.bpSystolic());
    const d = parseFloat(this.bpDiastolic());
    if (!s || !d) return '';
    return ((s + 2 * d) / 3).toFixed(1);
  });

  bmiStatus = computed<VitalStatus>(() => classifyVital(this.bmi(), VITAL_RANGES['bmi']));
  bpSystolicStatus = computed<VitalStatus>(() => classifyVital(this.bpSystolic(), VITAL_RANGES['bpSystolic']));
  bpDiastolicStatus = computed<VitalStatus>(() => classifyVital(this.bpDiastolic(), VITAL_RANGES['bpDiastolic']));
  mapStatus = computed<VitalStatus>(() => classifyVital(this.map(), VITAL_RANGES['map']));
  pulseStatus = computed<VitalStatus>(() => classifyVital(this.pulse(), VITAL_RANGES['pulse']));
  temperatureStatus = computed<VitalStatus>(() => classifyVital(this.temperature(), VITAL_RANGES['temperature']));
  spo2Status = computed<VitalStatus>(() => classifyVital(this.spo2(), VITAL_RANGES['spo2']));
  respiratoryRateStatus = computed<VitalStatus>(() => classifyVital(this.respiratoryRate(), VITAL_RANGES['respiratoryRate']));
  bloodGlucoseStatus = computed<VitalStatus>(() => classifyVital(this.bloodGlucose(), VITAL_RANGES['bloodGlucose']));
  painScoreStatus = computed<VitalStatus>(() => classifyVital(this.painScore(), VITAL_RANGES['painScore']));

  allStatuses = computed<VitalStatus[]>(() => [
    this.bmiStatus(),
    this.bpSystolicStatus(),
    this.bpDiastolicStatus(),
    this.mapStatus(),
    this.pulseStatus(),
    this.temperatureStatus(),
    this.spo2Status(),
    this.respiratoryRateStatus(),
    this.bloodGlucoseStatus(),
    this.painScoreStatus()
  ]);

  criticalCount = computed(() => this.allStatuses().filter(s => s === 'red').length);
  borderlineCount = computed(() => this.allStatuses().filter(s => s === 'yellow').length);

  constructor(
    private router: Router,
    private toastService: ToastService,
    public sidebarService: SidebarService,
    public authService: AuthService,
    public queueService: OpdQueueService
  ) {
    if (this.authService.isPatientExecutive() || this.authService.isDoctor()) {
      this.toastService.warning('This screen is restricted to nursing staff.');
      this.router.navigate([this.authService.loginAs(this.authService.currentRole())]);
    }

    // Auto-focus the Weight field as soon as a patient is selected and the form renders.
    effect(() => {
      const uhid = this.selectedUhid();
      const input = this.weightInput();
      if (uhid && input) {
        input.nativeElement.focus();
      }
    });
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

  selectPatient(uhid: string): void {
    this.selectedUhid.set(uhid);
    this.alertDismissed.set(false);
    const patient = this.queueService.getPatient(uhid);
    if (patient?.vitals) {
      this.weight.set(patient.vitals.weight);
      this.height.set(patient.vitals.height);
      this.waistCircumference.set(patient.vitals.waistCircumference);
      this.bpSystolic.set(patient.vitals.bpSystolic);
      this.bpDiastolic.set(patient.vitals.bpDiastolic);
      this.pulse.set(patient.vitals.pulse);
      this.temperature.set(patient.vitals.temperature);
      this.spo2.set(patient.vitals.spo2);
      this.respiratoryRate.set(patient.vitals.respiratoryRate);
      this.bloodGlucose.set(patient.vitals.bloodGlucose);
      this.painScore.set(patient.vitals.painScore);
    } else {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.weight.set('');
    this.height.set('');
    this.waistCircumference.set('');
    this.bpSystolic.set('');
    this.bpDiastolic.set('');
    this.pulse.set('');
    this.temperature.set('');
    this.spo2.set('');
    this.respiratoryRate.set('');
    this.bloodGlucose.set('');
    this.painScore.set('');
  }

  saveVitals(): void {
    const uhid = this.selectedUhid();
    if (!uhid) {
      this.toastService.warning('Please select a patient from the queue first.');
      return;
    }
    if (!this.weight() || !this.height() || !this.bpSystolic() || !this.bpDiastolic() || !this.pulse()) {
      this.toastService.warning('Please fill in Weight, Height, Blood Pressure and Pulse before saving.');
      return;
    }

    const vitals: Vitals = {
      weight: this.weight(),
      height: this.height(),
      bmi: this.bmi(),
      waistCircumference: this.waistCircumference(),
      bpSystolic: this.bpSystolic(),
      bpDiastolic: this.bpDiastolic(),
      map: this.map(),
      pulse: this.pulse(),
      temperature: this.temperature(),
      spo2: this.spo2(),
      respiratoryRate: this.respiratoryRate(),
      bloodGlucose: this.bloodGlucose(),
      painScore: this.painScore(),
      recordedBy: this.authService.currentUser().name,
      recordedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };

    this.queueService.recordVitals(uhid, vitals);

    if (this.criticalCount() > 0) {
      this.toastService.warning(`Vitals saved, but ${this.criticalCount()} reading(s) are CRITICAL. Please alert the physician immediately.`);
    } else {
      this.toastService.success(`Vitals recorded for ${this.selectedPatient()?.name}.`);
    }

    this.selectedUhid.set(null);
    this.resetForm();
  }

  clearForm(): void {
    this.selectedUhid.set(null);
    this.alertDismissed.set(false);
    this.resetForm();
  }

  dismissAlert(): void {
    this.alertDismissed.set(true);
  }

  logout(): void {
    this.toastService.info('Logged out successfully.');
    this.router.navigate(['/login']);
  }

  openHelp(): void {
    this.toastService.info('Vitals Recording Help & Guidelines opening...');
  }
}
