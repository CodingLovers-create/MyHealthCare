import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { ToastService } from '../../core/services/toast.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { AuthService } from '../../core/services/auth.service';

export interface PatientSearchResult {
  uhid: string;
  name: string;
  ageGender: string;
  mobile: string;
  aadhar: string;
  city: string;
  lastVisit: string;
}

@Component({
  selector: 'app-magic-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './magic-search.component.html'
})
export class MagicSearchComponent {
  activeModuleTab = signal<string>('MagicSearch');
  searchQuery = signal<string>('');
  showAdvanceSearch = signal<boolean>(false);
  isDrawerOpen = signal<boolean>(false);
  hasSearched = signal<boolean>(false);

  // Advanced filter fields
  advUhid = signal<string>('');
  advName = signal<string>('');
  advMobile = signal<string>('');
  advAadhar = signal<string>('');
  advGender = signal<string>('All');

  allPatients: PatientSearchResult[] = [
    { uhid: 'RFH2026001', name: 'Jagdish Ramji Thakkar', ageGender: '58 Y / Male', mobile: '+91 9820198201', aadhar: '4532 8901 2345', city: 'Mumbai', lastVisit: '07 Sep 2026' },
    { uhid: 'RFH2026002', name: 'Mohd. Zubair Qureshi', ageGender: '42 Y / Male', mobile: '+91 9819283746', aadhar: '9012 3456 7890', city: 'Thane', lastVisit: '08 Sep 2026' },
    { uhid: 'RFH2026003', name: 'Anuradha Jadhav', ageGender: '35 Y / Female', mobile: '+91 9765432109', aadhar: '1234 5678 9012', city: 'Navi Mumbai', lastVisit: '03 Jan 2026' },
    { uhid: 'RFH2026004', name: 'Rushikesh Mondkar', ageGender: '29 Y / Male', mobile: '+91 9892011223', aadhar: '6789 0123 4567', city: 'Pune', lastVisit: '03 Jan 2026' },
    { uhid: 'RFH2026005', name: 'Pooja Dhanecha', ageGender: '31 Y / Female', mobile: '+91 9123456789', aadhar: '8901 2345 6789', city: 'Mumbai', lastVisit: '03 Jan 2026' }
  ];

  searchResults = signal<PatientSearchResult[]>([]);

  moduleTabs = computed(() => this.authService.allowedModules());

  constructor(
    private router: Router, 
    private toastService: ToastService,
    public sidebarService: SidebarService,
    public authService: AuthService
  ) {
    if (this.authService.isPatientExecutive()) {
      this.toastService.warning('Patient Executives are restricted to the Booking Appointments screen.');
      this.router.navigate(['/doctor-appointment']);
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
    }
  }

  executeSearch(): void {
    const query = this.searchQuery().trim().toLowerCase();
    this.hasSearched.set(true);
    if (!query) {
      this.searchResults.set(this.allPatients);
      this.isDrawerOpen.set(true);
      this.toastService.info('Displaying all registered patients.');
      return;
    }

    const filtered = this.allPatients.filter(p =>
      p.uhid.toLowerCase().includes(query) ||
      p.name.toLowerCase().includes(query) ||
      p.mobile.includes(query) ||
      p.aadhar.includes(query) ||
      p.city.toLowerCase().includes(query)
    );

    this.searchResults.set(filtered);
    this.isDrawerOpen.set(true);

    if (filtered.length > 0) {
      this.toastService.success(`Found ${filtered.length} patient record(s).`);
    } else {
      this.toastService.warning('No matching patient record found.');
    }
  }

  executeAdvanceSearch(): void {
    this.hasSearched.set(true);
    let results = [...this.allPatients];

    if (this.advUhid()) {
      results = results.filter(p => p.uhid.toLowerCase().includes(this.advUhid().toLowerCase()));
    }
    if (this.advName()) {
      results = results.filter(p => p.name.toLowerCase().includes(this.advName().toLowerCase()));
    }
    if (this.advMobile()) {
      results = results.filter(p => p.mobile.includes(this.advMobile()));
    }

    this.searchResults.set(results);
    this.isDrawerOpen.set(true);
    this.toastService.success(`Advance Search returned ${results.length} patient record(s).`);
  }

  toggleAdvanceSearch(): void {
    this.showAdvanceSearch.update(v => !v);
  }

  toggleVoiceSearch(): void {
    this.toastService.info('Listening... Speak patient UHID or Name.');
  }

  toggleDrawer(): void {
    this.isDrawerOpen.update(v => !v);
  }

  logout(): void {
    this.toastService.info('Logged out successfully.');
    this.router.navigate(['/login']);
  }

  openHelp(): void {
    this.toastService.info('MagicSearch Help & Guidelines opening...');
  }
}
