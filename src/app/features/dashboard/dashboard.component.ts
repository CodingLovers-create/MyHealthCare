import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { ToastService } from '../../core/services/toast.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

export interface WorklistTask {
  id: string;
  date: string;
  time: string;
  description: string;
  type: string;
  uhid: string;
  patientName: string;
  initiatedBy: string;
  patientLocation: string;
  statusCode: 'AR' | 'CS' | 'IP' | 'PD' | 'CONFIRMED' | 'SCHEDULED';
  statusText: string;
  isUpcomingAppointment?: boolean;
  mobile?: string;
  ageGender?: string;
  fee?: number;
  practitioner?: string;
  department?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  public sidebarService = inject(SidebarService);
  public authService = inject(AuthService);

  activeModuleTab = signal<string>('MyDesk');
  activeWorklistTab = signal<string>('Worklist');
  searchQuery = signal<string>('');

  // Pagination Signals & Computeds
  currentPage = signal<number>(1);
  pageSize = signal<number>(8);

  moduleTabs = computed(() => this.authService.allowedModules());

  defaultTasks: WorklistTask[] = [];

  tasks = signal<WorklistTask[]>([]);

  upcomingCount = computed(() => {
    return this.tasks().filter(t => t.isUpcomingAppointment || t.statusCode === 'CONFIRMED' || t.statusCode === 'SCHEDULED').length;
  });

  filteredTasks = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const tab = this.activeWorklistTab();
    let list = this.tasks();

    if (tab === 'Upcoming') {
      list = list.filter(t => t.isUpcomingAppointment || t.statusCode === 'CONFIRMED' || t.statusCode === 'SCHEDULED');
    } else if (tab === 'Completed') {
      list = list.filter(t => t.statusCode === 'CS');
    } else if (tab === 'Notifications') {
      list = list.filter(t => t.statusCode === 'AR');
    }

    if (!q) return list;
    return list.filter(t =>
      t.description.toLowerCase().includes(q) ||
      t.patientName.toLowerCase().includes(q) ||
      t.initiatedBy.toLowerCase().includes(q) ||
      t.uhid.toLowerCase().includes(q) ||
      t.statusText.toLowerCase().includes(q)
    );
  });

  totalItems = computed(() => this.filteredTasks().length);

  calculatedTotalPages = computed(() => {
    const total = Math.ceil(this.totalItems() / this.pageSize());
    return total > 0 ? total : 1;
  });

  paginatedTasks = computed(() => {
    const page = Math.min(Math.max(1, this.currentPage()), this.calculatedTotalPages());
    const start = (page - 1) * this.pageSize();
    return this.filteredTasks().slice(start, start + this.pageSize());
  });

  minItemsDisplay = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.totalItems());
  });

  pageNumbers = computed(() => {
    const total = this.calculatedTotalPages();
    const current = this.currentPage();
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  });

  goToPage(page: number | string): void {
    if (typeof page === 'number') {
      if (page >= 1 && page <= this.calculatedTotalPages()) {
        this.currentPage.set(page);
      }
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.calculatedTotalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize.set(newSize);
    this.currentPage.set(1);
  }

  onSearchQueryChange(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
  }

  constructor() {
    if (this.authService.isPatientExecutive()) {
      this.toastService.warning('Patient Executives are restricted to the Booking Appointments screen.');
      this.router.navigate(['/doctor-appointment']);
    }
  }

  ngOnInit(): void {
    this.loadAppointmentsFromApi();
  }

  loadAppointmentsFromApi(): void {
    this.apiService.get<any[]>('appointments').subscribe({
      next: (apiData) => {
        let loadedApts: WorklistTask[] = [];
        if (Array.isArray(apiData) && apiData.length > 0) {
          loadedApts = apiData.map(apt => this.mapApiAppointmentToTask(apt));
        }
        this.tasks.set(loadedApts);
      },
      error: () => {
        this.tasks.set([]);
      }
    });
  }

  private mapApiAppointmentToTask(apt: any): WorklistTask {
    const isBilled = apt.isBilled || apt.status === 'BILLED' || apt.status === 'CS';
    const isArrived = apt.status === 'ARRIVED AT DESK' || apt.status === 'CONFIRMED' || apt.status === 'AR';

    let code: any = 'SCHEDULED';
    let isUpcoming = true;
    let stText = 'Upcoming Appointment (SCHEDULED)';

    if (isBilled) {
      code = 'CS';
      isUpcoming = false;
      stText = `BILLED (${apt.receiptNumber || 'OP Billing Completed'})`;
    } else if (isArrived) {
      code = 'CONFIRMED';
      isUpcoming = false;
      stText = `ARRIVED AT DESK ${apt.visitId ? '(' + apt.visitId + ')' : ''}`;
    } else {
      code = 'SCHEDULED';
      isUpcoming = true;
      stText = `Upcoming Appointment (${apt.status || 'SCHEDULED'})`;
    }

    let dateVal = apt.dateStr || apt.date || '';
    let timeVal = apt.time || '';

    if (!dateVal || !timeVal) {
      const sourceDate = apt.bookedOn ? new Date(apt.bookedOn) : new Date();
      if (!isNaN(sourceDate.getTime())) {
        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        if (!dateVal) {
          dateVal = `${days[sourceDate.getDay()]} ${sourceDate.getDate().toString().padStart(2, '0')} ${months[sourceDate.getMonth()]}`;
        }
        if (!timeVal) {
          let hours = sourceDate.getHours();
          const mins = sourceDate.getMinutes().toString().padStart(2, '0');
          const ampm = hours >= 12 ? 'PM' : 'AM';
          hours = hours % 12 || 12;
          timeVal = `${hours.toString().padStart(2, '0')}:${mins} ${ampm}`;
        }
      }
    }

    return {
      id: apt.id ? `apt-${apt.id}` : 'apt-' + Math.floor(Math.random() * 100000),
      date: dateVal,
      time: timeVal,
      description: apt.description || (apt.practitioner ? `Doctor Consultation - ${apt.practitioner}` : 'OP Consultation'),
      type: apt.type || 'OP',
      uhid: apt.uhid || '',
      patientName: apt.patientName || '',
      initiatedBy: apt.practitioner || apt.initiatedBy || '',
      patientLocation: apt.patientLocation || apt.department || 'OPD Clinic',
      statusCode: code,
      statusText: stText,
      isUpcomingAppointment: isUpcoming,
      mobile: (apt.mobile || '').replace(/\+91\s?/, ''),
      ageGender: apt.ageGender || (apt.age ? `${apt.age} Y` : ''),
      fee: apt.fee,
      practitioner: apt.practitioner,
      department: apt.department
    };
  }

  markPatientArrival(task: WorklistTask): void {
    const visitId = 'OPV-2026-' + Math.floor(10000 + Math.random() * 90000);
    this.tasks.update(current => 
      current.map(t => {
        if (t.id === task.id) {
          return {
            ...t,
            statusCode: 'CONFIRMED',
            statusText: `Arrived at Desk (Active Visit ID: ${visitId})`,
            patientLocation: 'Front Desk / Waiting Area'
          };
        }
        return t;
      })
    );
    this.toastService.success(`Patient "${task.patientName}" marked as Arrived! Active Visit ID: ${visitId}`);
  }

  isTaskBilled(task: WorklistTask): boolean {
    const status = (task.statusCode || '').toString().toUpperCase();
    const statusText = (task.statusText || '').toString().toLowerCase();
    return (
      status === 'CS' || 
      status === 'BILLED' || 
      status === 'PAID' || 
      statusText.includes('billed') || 
      statusText.includes('paid') || 
      statusText.includes('receipt') || 
      statusText.includes('cashier scroll')
    );
  }

  isTaskScheduled(task: WorklistTask): boolean {
    const status = (task.statusCode || '').toString().toUpperCase();
    const statusText = (task.statusText || '').toString().toLowerCase();
    return (
      (status === 'SCHEDULED' || statusText.includes('scheduled')) && 
      !statusText.includes('arrived') &&
      !statusText.includes('desk') &&
      !this.isTaskBilled(task)
    );
  }

  openOpBilling(task: WorklistTask): void {
    if (this.isTaskScheduled(task)) {
      this.toastService.warning(`Cannot process OP Bill: Patient "${task.patientName}" is scheduled. Please mark arrival first.`);
      return;
    }
    this.toastService.info(`Opening OP Billing Desk for ${task.patientName}...`);
    this.router.navigate(['/op-billing'], {
      queryParams: {
        name: task.patientName,
        uhid: task.uhid,
        visitId: 'OPV-2026-' + Math.floor(10000 + Math.random() * 90000),
        practitioner: task.initiatedBy
      }
    });
  }

  cancelAppointmentTask(task: WorklistTask): void {
    if (task.statusCode === 'CS') {
      this.toastService.warning('This appointment is already cancelled.');
      return;
    }

    this.tasks.update(current => 
      current.map(t => {
        if (t.id === task.id) {
          return {
            ...t,
            statusCode: 'CS',
            statusText: 'CANCELLED BY ADMIN'
          };
        }
        return t;
      })
    );

    if (task.id && !task.id.startsWith('apt-')) {
      this.apiService.patch(`appointments/${task.id}`, { status: 'CANCELLED' }).subscribe();
    }

    this.toastService.success(`Appointment for "${task.patientName}" (${task.uhid}) has been CANCELLED.`);
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

  selectWorklistTab(tab: string): void {
    this.activeWorklistTab.set(tab);
    this.currentPage.set(1);
    if (tab === 'Upcoming') {
      this.toastService.info(`Filtered upcoming patient appointments (${this.upcomingCount()} records).`);
    }
  }

  refreshTasks(): void {
    this.loadAppointmentsFromApi();
    this.toastService.info('Worklist refreshed from JSON Server.');
  }

  showPdfModal = signal<boolean>(false);
  selectedPdfData = signal<{ name: string; uhid: string; visitId: string; mobile: string; ageGender: string; doctorName: string; department: string; dateStr: string; timeStr: string } | null>(null);

  openPatientPdf(task: WorklistTask): void {
    const cleanUhid = (task.uhid || '').toLowerCase().trim();
    const cleanName = (task.patientName || '').toLowerCase().trim();

    const checkIsBilled = (t: any) => {
      const status = (t.status || t.statusCode || '').toString().toUpperCase();
      const statusText = (t.statusText || t.description || '').toString().toLowerCase();
      return t.isBilled || 
             status === 'BILLED' || 
             status === 'CS' || 
             status === 'PAID' || 
             statusText.includes('billed') || 
             statusText.includes('receipt') || 
             statusText.includes('cashier scroll') || 
             statusText.includes('paid');
    };

    if (checkIsBilled(task)) {
      this.displayPdfModal(task);
      return;
    }

    this.apiService.get<any[]>('appointments').subscribe({
      next: (appts) => {
        let isBilledInApi = false;
        if (Array.isArray(appts)) {
          isBilledInApi = appts.some(a => {
            const aUhid = (a.uhid || '').toLowerCase().trim();
            const aName = (a.patientName || '').toLowerCase().trim();
            const isMatch = (cleanUhid && aUhid === cleanUhid) || (cleanName && (aName.includes(cleanName) || cleanName.includes(aName)));
            return isMatch && checkIsBilled(a);
          });
        }

        if (isBilledInApi) {
          this.displayPdfModal(task);
        } else {
          this.toastService.warning(`Cannot open PDF: Patient "${task.patientName}" is not billed yet. Please complete OP Billing first.`);
        }
      },
      error: () => {
        this.toastService.warning(`Cannot open PDF: Patient "${task.patientName}" is not billed yet. Please complete OP Billing first.`);
      }
    });
  }

  private displayPdfModal(task: WorklistTask): void {
    let visitId = 'OPV-2026-' + Math.floor(10000 + Math.random() * 90000);
    const matchGroup = (task.statusText || '').match(/OPV-2026-\d+/);
    if (matchGroup) {
      visitId = matchGroup[0];
    }

    this.selectedPdfData.set({
      name: task.patientName || '',
      uhid: task.uhid || '',
      visitId: visitId,
      mobile: (task.mobile || '').replace(/\+91\s?/, ''),
      ageGender: task.ageGender || '',
      doctorName: task.initiatedBy || task.practitioner || '',
      department: task.patientLocation || task.department || '',
      dateStr: task.date || new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
      timeStr: task.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    this.showPdfModal.set(true);
  }

  printPdf(): void {
    window.print();
  }

  logout(): void {
    this.toastService.info('Logged out successfully.');
    this.router.navigate(['/login']);
  }

  openHelp(): void {
    this.toastService.info('Help documentation & video tutorials opening...');
  }
}
