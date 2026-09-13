import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { ToastService } from '../../core/services/toast.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { MedicalRecordsService } from '../../core/services/medical-records.service';
import { Visit } from '../../core/models/visit.model';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

export interface PatientSummary {
  uhid: string;
  name: string;
  mobile: string;
  gender?: string;
  dob?: string;
  city?: string;
}

@Component({
  selector: 'app-medical-records',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './medical-records.component.html'
})
export class MedicalRecordsComponent {
  activeModuleTab = signal<string>('MedicalRecords');
  searchQuery = signal<string>('');
  selectedPatient = signal<PatientSummary | null>(null);
  visits = signal<Visit[]>([]);
  isLoadingVisits = signal<boolean>(false);
  selectedVisitForPrint = signal<Visit | null>(null);

  private allPatients: PatientSummary[] = [];

  moduleTabs = computed(() => this.authService.allowedModules());

  matchedPatients = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return [];
    return this.allPatients.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.uhid || '').toLowerCase().includes(q) ||
      (p.mobile || '').toLowerCase().includes(q)
    );
  });

  sortedVisits = computed(() => {
    return [...this.visits()].sort((a, b) => this.parseVisitDate(b.visitDate) - this.parseVisitDate(a.visitDate));
  });

  constructor(
    private router: Router,
    private toastService: ToastService,
    public sidebarService: SidebarService,
    public authService: AuthService,
    private apiService: ApiService,
    private medicalRecordsService: MedicalRecordsService
  ) {
    this.apiService.get<any[]>('patients').subscribe(data => {
      this.allPatients = Array.isArray(data) ? data.map(p => ({
        uhid: p.uhid, name: p.name, mobile: p.mobile, gender: p.gender, dob: p.dob, city: p.city
      })) : [];
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
    } else if (tabId === 'OpBilling') {
      this.router.navigate(['/op-billing']);
    } else if (tabId === 'VitalsRecording') {
      this.router.navigate(['/vitals-recording']);
    } else if (tabId === 'DoctorPatientList') {
      this.router.navigate(['/doctor-patient-list']);
    } else if (tabId === 'MedicalRecords') {
      this.router.navigate(['/medical-records']);
    }
  }

  selectPatient(patient: PatientSummary): void {
    this.selectedPatient.set(patient);
    this.searchQuery.set('');
    this.isLoadingVisits.set(true);
    this.medicalRecordsService.getVisitsByUhid(patient.uhid).subscribe(visits => {
      this.visits.set(Array.isArray(visits) ? visits : []);
      this.isLoadingVisits.set(false);
    });
  }

  printVisit(visit: Visit): void {
    this.selectedVisitForPrint.set(visit);
  }

  closePrintModal(): void {
    this.selectedVisitForPrint.set(null);
  }

  triggerPrint(): void {
    window.print();
  }

  clearSelection(): void {
    this.selectedPatient.set(null);
    this.visits.set([]);
    this.searchQuery.set('');
  }

  private parseVisitDate(dateStr: string): number {
    const parts = (dateStr || '').split('/');
    if (parts.length === 3) {
      const [d, m, y] = parts.map(Number);
      return new Date(y, m - 1, d).getTime();
    }
    const parsed = Date.parse(dateStr);
    return isNaN(parsed) ? 0 : parsed;
  }

  logout(): void {
    this.toastService.info('Logged out successfully.');
    this.router.navigate(['/login']);
  }

  openHelp(): void {
    this.toastService.info('Medical Records Help & Guidelines opening...');
  }
}
