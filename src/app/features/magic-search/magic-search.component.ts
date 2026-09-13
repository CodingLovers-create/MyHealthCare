import { Component, signal, computed, inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { ToastService } from '../../core/services/toast.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { UhidFormatPipe } from '../../shared/pipes/uhid-format.pipe';

export interface PatientSearchResult {
  id?: string;
  uhid: string;
  name: string;
  ageGender: string;
  mobile: string;
  aadhar: string;
  email?: string;
  city: string;
  lastVisit: string;
}

@Component({
  selector: 'app-magic-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent, UhidFormatPipe],
  templateUrl: './magic-search.component.html'
})
export class MagicSearchComponent implements OnInit {
  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;
  private apiService = inject(ApiService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  public sidebarService = inject(SidebarService);
  public authService = inject(AuthService);

  activeModuleTab = signal<string>('MagicSearch');
  searchQuery = signal<string>('');
  showAdvanceSearch = signal<boolean>(false);
  isDrawerOpen = signal<boolean>(true);
  hasSearched = signal<boolean>(false);

  // Advanced filter fields
  advUhid = signal<string>('');
  advName = signal<string>('');
  advMobile = signal<string>('');
  advAadhar = signal<string>('');
  advGender = signal<string>('All');

  defaultPatients: PatientSearchResult[] = [
    { id: '1', uhid: 'RFH2026001', name: 'Jagdish Ramji Thakkar', ageGender: '58 Y / Male', mobile: '+91 9820198201', aadhar: '4532 8901 2345', email: 'jagdish.thakkar@gmail.com', city: 'Mumbai', lastVisit: '07 Sep 2026' },
    { id: '2', uhid: 'RFH2026002', name: 'Mohd. Zubair Qureshi', ageGender: '42 Y / Male', mobile: '+91 9819283746', aadhar: '9012 3456 7890', email: 'zubair.qureshi@yahoo.com', city: 'Thane', lastVisit: '08 Sep 2026' },
    { id: '3', uhid: 'RFH2026003', name: 'Anuradha Jadhav', ageGender: '35 Y / Female', mobile: '+91 9765432109', aadhar: '1234 5678 9012', email: 'anuradha.j@gmail.com', city: 'Navi Mumbai', lastVisit: '03 Jan 2026' },
    { id: '4', uhid: 'RFH2026004', name: 'Rushikesh Mondkar', ageGender: '29 Y / Male', mobile: '+91 9892011223', aadhar: '6789 0123 4567', email: 'rushi.mondkar@gmail.com', city: 'Pune', lastVisit: '03 Jan 2026' },
    { id: '5', uhid: 'RFH2026005', name: 'Pooja Dhanecha', ageGender: '31 Y / Female', mobile: '+91 9123456789', aadhar: '8901 2345 6789', email: 'pooja.d@gmail.com', city: 'Mumbai', lastVisit: '03 Jan 2026' }
  ];

  allPatientsList = signal<PatientSearchResult[]>([]);
  searchResults = signal<PatientSearchResult[]>([]);

  moduleTabs = computed(() => this.authService.allowedModules());

  constructor() {
    if (this.authService.isPatientExecutive()) {
      this.toastService.warning('Patient Executives are restricted to the Booking Appointments screen.');
      this.router.navigate(['/doctor-appointment']);
    }
  }

  ngOnInit(): void {
    this.loadPatientsFromApi();
  }

  loadPatientsFromApi(): void {
    this.apiService.get<any[]>('patients').subscribe({
      next: (apiData) => {
        let loadedPatients: PatientSearchResult[] = [];
        if (Array.isArray(apiData) && apiData.length > 0) {
          loadedPatients = apiData.map(p => this.mapApiPatientToSearchResult(p));
        }

        // Merge API patients with defaultPatients avoiding duplicate UHIDs
        const existingUhids = new Set(loadedPatients.map(p => p.uhid.toUpperCase()));
        const combined = [
          ...loadedPatients,
          ...this.defaultPatients.filter(dp => !existingUhids.has(dp.uhid.toUpperCase()))
        ];

        this.allPatientsList.set(combined);
        this.searchResults.set(combined);
      },
      error: () => {
        this.allPatientsList.set(this.defaultPatients);
        this.searchResults.set(this.defaultPatients);
      }
    });
  }

  private mapApiPatientToSearchResult(p: any): PatientSearchResult {
    let ageGender = 'N/A';
    if (p.age) {
      ageGender = `${p.age} Y / ${p.gender || 'Unknown'}`;
    } else if (p.dob) {
      const birthYear = new Date(p.dob).getFullYear();
      const age = isNaN(birthYear) ? '' : `${2026 - birthYear} Y / `;
      ageGender = `${age}${p.gender || 'Unknown'}`;
    } else if (p.gender) {
      ageGender = p.gender;
    }

    let city = p.city || p.address?.city || 'Mumbai';
    let lastVisit = '12 Sep 2026';
    if (p.registeredOn) {
      try {
        const d = new Date(p.registeredOn);
        if (!isNaN(d.getTime())) {
          lastVisit = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        } else {
          lastVisit = p.registeredOn;
        }
      } catch {
        lastVisit = p.registeredOn;
      }
    }

    const fullName = p.name ? p.name : `${p.title || ''} ${p.firstName || ''} ${p.middleName || ''} ${p.lastName || ''}`.replace(/\s+/g, ' ').trim();

    return {
      id: p.id,
      uhid: p.uhid || 'RFH' + Math.floor(100000 + Math.random() * 900000),
      name: fullName || 'Unknown Patient',
      ageGender: ageGender,
      mobile: p.mobile ? (p.mobile.startsWith('+91') ? p.mobile : `+91 ${p.mobile}`) : 'N/A',
      aadhar: p.aadhar || p.aadharId || 'N/A',
      email: p.email || 'N/A',
      city: city,
      lastVisit: lastVisit
    };
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

  searchWithQuery(query: string): void {
    this.searchQuery.set(query);
    this.executeSearch();
  }

  executeSearch(): void {
    const query = this.searchQuery().trim().toLowerCase();
    this.hasSearched.set(true);
    this.isDrawerOpen.set(true);

    if (!query) {
      this.searchResults.set(this.allPatientsList());
      this.toastService.info(`Displaying all ${this.allPatientsList().length} registered patient records.`);
      return;
    }

    const filtered = this.allPatientsList().filter(p =>
      p.uhid.toLowerCase().includes(query) ||
      p.name.toLowerCase().includes(query) ||
      p.mobile.toLowerCase().includes(query) ||
      p.aadhar.toLowerCase().includes(query) ||
      (p.email && p.email.toLowerCase().includes(query)) ||
      p.city.toLowerCase().includes(query) ||
      p.ageGender.toLowerCase().includes(query)
    );

    this.searchResults.set(filtered);

    if (filtered.length > 0) {
      this.toastService.success(`Found ${filtered.length} matching patient record(s).`);
    } else {
      this.toastService.warning(`No matching patient record found for "${query}".`);
    }
  }

  executeAdvanceSearch(): void {
    this.hasSearched.set(true);
    let results = [...this.allPatientsList()];

    const uhidQ = this.advUhid().trim().toLowerCase();
    const nameQ = this.advName().trim().toLowerCase();
    const mobileQ = this.advMobile().trim().toLowerCase();
    const aadharQ = this.advAadhar().trim().toLowerCase();
    const genderQ = this.advGender();

    if (uhidQ) {
      results = results.filter(p => p.uhid.toLowerCase().includes(uhidQ));
    }
    if (nameQ) {
      results = results.filter(p => p.name.toLowerCase().includes(nameQ));
    }
    if (mobileQ) {
      results = results.filter(p => p.mobile.toLowerCase().includes(mobileQ));
    }
    if (aadharQ) {
      results = results.filter(p => p.aadhar.toLowerCase().includes(aadharQ));
    }
    if (genderQ && genderQ !== 'All') {
      results = results.filter(p => p.ageGender.toLowerCase().includes(genderQ.toLowerCase()));
    }

    this.searchResults.set(results);
    this.isDrawerOpen.set(true);
    if (results.length > 0) {
      this.toastService.success(`Advance Search returned ${results.length} patient record(s).`);
    } else {
      this.toastService.warning('No matching patient record found with advance filters.');
    }
  }

  toggleAdvanceSearch(): void {
    this.showAdvanceSearch.update(v => !v);
  }

  toggleVoiceSearch(): void {
    this.toastService.info('Listening... Speak patient UHID or Name.');
    setTimeout(() => {
      this.searchWithQuery('Prathamesh');
      this.toastService.success('Voice recognized: "Prathamesh"');
    }, 1500);
  }

  toggleDrawer(): void {
    this.isDrawerOpen.update(v => !v);
  }

  // Cancel Appointment Modal State
  showCancelModal = signal<boolean>(false);
  selectedPatientForCancel = signal<PatientSearchResult | null>(null);
  patientAppointments = signal<any[]>([]);
  cancelReason = signal<string>('Patient Request / Unwell');
  isLoadingAppts = signal<boolean>(false);

  bookAppointment(patient: PatientSearchResult): void {
    this.toastService.info(`Redirecting to Appointment Booking for ${patient.name}...`);
    this.router.navigate(['/doctor-appointment'], {
      queryParams: {
        mobile: patient.mobile.replace(/\+91\s?/, ''),
        name: patient.name
      }
    });
  }

  openCancelModal(patient: PatientSearchResult): void {
    this.selectedPatientForCancel.set(patient);
    this.showCancelModal.set(true);
    this.isLoadingAppts.set(true);

    const cleanMobile = patient.mobile.replace(/\+91\s?/, '').trim();
    const cleanName = patient.name.toLowerCase().trim();

    this.apiService.get<any[]>('appointments').subscribe({
      next: (appts) => {
        this.isLoadingAppts.set(false);
        let matches: any[] = [];

        if (Array.isArray(appts)) {
          matches = appts.filter(a => {
            const aName = (a.patientName || '').toLowerCase();
            const aMobile = (a.mobile || '').replace(/\+91\s?/, '').trim();
            const aUhid = (a.uhid || '').toLowerCase();

            return (
              (aUhid && aUhid === patient.uhid.toLowerCase()) ||
              (aName && (aName.includes(cleanName) || cleanName.includes(aName))) ||
              (cleanMobile && aMobile.includes(cleanMobile))
            );
          });
        }

        // If no matching appointments found in API, generate realistic active appointments for demo cancellation
        if (matches.length === 0) {
          matches = [
            {
              id: 'mock-101',
              dateStr: 'SAT 12 SEP',
              time: '09:30 AM',
              patientName: patient.name,
              uhid: patient.uhid,
              mobile: cleanMobile || '9820198201',
              practitioner: 'Dr. Susheel Bindroo (Pulmonology)',
              fee: 1500,
              status: 'CONFIRMED',
              type: 'OP'
            },
            {
              id: 'mock-102',
              dateStr: 'SUN 13 SEP',
              time: '11:00 AM',
              patientName: patient.name,
              uhid: patient.uhid,
              mobile: cleanMobile || '9820198201',
              practitioner: 'Dr. Alok Shah (Cardiology)',
              fee: 2000,
              status: 'CONFIRMED',
              type: 'OP'
            }
          ];
        }

        this.patientAppointments.set(matches);
      },
      error: () => {
        this.isLoadingAppts.set(false);
        this.patientAppointments.set([
          {
            id: 'mock-101',
            dateStr: 'SAT 12 SEP',
            time: '09:30 AM',
            patientName: patient.name,
            uhid: patient.uhid,
            mobile: cleanMobile || '9820198201',
            practitioner: 'Dr. Susheel Bindroo (Pulmonology)',
            fee: 1500,
            status: 'CONFIRMED',
            type: 'OP'
          }
        ]);
      }
    });
  }

  cancelAppointmentItem(appt: any): void {
    if (appt.status === 'CANCELLED') {
      this.toastService.warning('This appointment is already cancelled.');
      return;
    }

    const reason = this.cancelReason();
    const updated = { ...appt, status: 'CANCELLED', cancellationReason: reason, cancelledOn: new Date().toISOString() };

    const currentAppts = this.patientAppointments();
    const updatedList = currentAppts.map(a => (a.id === appt.id || (a.time === appt.time && a.dateStr === appt.dateStr)) ? updated : a);
    this.patientAppointments.set(updatedList);

    if (appt.id && !appt.id.toString().startsWith('mock-')) {
      this.apiService.patch(`appointments/${appt.id}`, { status: 'CANCELLED', cancellationReason: reason }).subscribe();
    }

    this.toastService.success(`Appointment with ${appt.practitioner} on ${appt.dateStr} at ${appt.time} has been CANCELLED.`);
  }

  markArrival(patient: PatientSearchResult): void {
    const generatedVisitId = 'OPV-2026-' + Math.floor(10000 + Math.random() * 90000);
    const newAppointmentVisit = {
      dateStr: 'SAT 12 SEP',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      patientName: patient.name,
      uhid: patient.uhid,
      mobile: patient.mobile.replace(/\+91\s?/, ''),
      practitioner: 'General OPD Clinic',
      fee: 1500,
      status: 'ARRIVED AT DESK',
      visitId: generatedVisitId,
      type: 'OP',
      description: `Active Desk Arrival Visit (${generatedVisitId})`,
      bookedOn: new Date().toISOString()
    };

    this.apiService.post('appointments', newAppointmentVisit).subscribe({
      next: (res) => {
        console.log('[JSON-Server] Desk Arrival visit generated from MagicSearch:', res);
      }
    });

    this.toastService.success(`Patient "${patient.name}" marked as Arrived at Front Desk! Active Visit ID: ${generatedVisitId}`);
    this.router.navigate(['/op-billing'], {
      queryParams: {
        name: patient.name,
        uhid: patient.uhid,
        visitId: generatedVisitId,
        mobile: patient.mobile.replace(/\+91\s?/, '')
      }
    });
  }

  registerOp(patient: PatientSearchResult): void {
    this.toastService.info(`Navigating to OP Registration...`);
    this.router.navigate(['/registration']);
  }

  openWorklist(patient: PatientSearchResult): void {
    this.toastService.info(`Opening MyDesk worklist for ${patient.name}...`);
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.toastService.info('Logged out successfully.');
    this.router.navigate(['/login']);
  }

  openHelp(): void {
    this.toastService.info('MagicSearch Help & Guidelines opening...');
  }
}
