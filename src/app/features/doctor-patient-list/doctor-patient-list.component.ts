import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { ToastService } from '../../core/services/toast.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { AuthService } from '../../core/services/auth.service';
import { OpdQueueService } from '../../core/services/opd-queue.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-doctor-patient-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './doctor-patient-list.component.html'
})
export class DoctorPatientListComponent {
  activeModuleTab = signal<string>('DoctorPatientList');
  searchQuery = signal<string>('');

  moduleTabs = computed(() => this.authService.allowedModules());

  filteredQueue = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.queueService.patients();
    if (!q) return list;
    return list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.uhid.toLowerCase().includes(q) ||
      p.tokenNo.toLowerCase().includes(q) ||
      p.doctorName.toLowerCase().includes(q)
    );
  });

  constructor(
    private router: Router,
    private toastService: ToastService,
    public sidebarService: SidebarService,
    public authService: AuthService,
    public queueService: OpdQueueService
  ) {
    if (!this.authService.isDoctor()) {
      this.toastService.warning('This screen is restricted to doctors.');
      const role = this.authService.currentRole() || 'admin';
      this.router.navigate([this.authService.loginAs(role)]);
    }
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

  openConsultation(uhid: string): void {
    const patient = this.queueService.getPatient(uhid);
    if (!patient?.vitals) {
      this.toastService.warning('Vitals have not been recorded for this patient yet.');
      return;
    }
    this.queueService.startConsultation(uhid);
    this.router.navigate(['/doctor-consultation', uhid]);
  }

  refreshQueue(): void {
    this.toastService.info('OPD queue refreshed.');
  }

  logout(): void {
    this.toastService.info('Logged out successfully.');
    this.router.navigate(['/login']);
  }

  openHelp(): void {
    this.toastService.info('OPD Queue Help & Guidelines opening...');
  }
}
