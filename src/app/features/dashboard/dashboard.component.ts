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
  currentPage = signal<number>(1);
  totalPages = signal<number>(390);

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
    return {
      id: apt.id ? `apt-${apt.id}` : 'apt-' + Math.floor(Math.random() * 100000),
      date: apt.dateStr || '',
      time: apt.time || '',
      description: apt.description || (apt.practitioner ? `Upcoming Doctor Consultation - ${apt.practitioner}` : ''),
      type: apt.type || 'OP',
      uhid: apt.uhid || '',
      patientName: apt.patientName || '',
      initiatedBy: apt.practitioner || apt.initiatedBy || '',
      patientLocation: apt.patientLocation || apt.department || '',
      statusCode: (apt.status === 'CONFIRMED' ? 'CONFIRMED' : 'SCHEDULED') as any,
      statusText: apt.status ? `Upcoming Appointment (${apt.status})` : '',
      isUpcomingAppointment: true,
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

  openOpBilling(task: WorklistTask): void {
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
    let visitId = 'OPV-2026-' + Math.floor(10000 + Math.random() * 90000);
    const isArrived = task.statusCode === 'CONFIRMED' && task.statusText.includes('Arrived');

    if (!isArrived) {
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

      const newAppointmentVisit = {
        dateStr: task.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: task.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        patientName: task.patientName,
        uhid: task.uhid,
        mobile: (task.mobile || '').replace(/\+91\s?/, ''),
        practitioner: task.initiatedBy || task.practitioner || '',
        fee: task.fee || 1500,
        status: 'ARRIVED AT DESK',
        visitId: visitId,
        type: task.type || 'OP',
        description: `Auto Desk Arrival on PDF View (${visitId})`,
        bookedOn: new Date().toISOString()
      };
      this.apiService.post('appointments', newAppointmentVisit).subscribe();

      this.toastService.success(`⚡ Desk Arrival automatically marked for "${task.patientName}"! Visit ID: ${visitId}`);
    } else {
      const matchGroup = (task.statusText || '').match(/OPV-2026-\d+/);
      if (matchGroup) {
        visitId = matchGroup[0];
      }
      this.toastService.info(`Opening Patient Case Paper PDF for ${task.patientName}...`);
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
