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

  defaultTasks: WorklistTask[] = [
    { 
      id: 'apt-1', 
      date: 'SAT 12 SEP', 
      time: '09:30 AM', 
      description: 'Upcoming Doctor Consultation - Dr. Susheel Bindroo', 
      type: 'OP', 
      uhid: 'RFH2026001', 
      patientName: 'Jagdish Ramji Thakkar', 
      initiatedBy: 'Dr. Susheel Bindroo', 
      patientLocation: 'Pulmonology OPD', 
      statusCode: 'CONFIRMED', 
      statusText: 'Upcoming Appointment Confirmed',
      isUpcomingAppointment: true 
    },
    { 
      id: 'apt-2', 
      date: 'SAT 12 SEP', 
      time: '10:30 AM', 
      description: 'Upcoming Doctor Consultation - Dr. Alok Shah', 
      type: 'OP', 
      uhid: 'RFH2026002', 
      patientName: 'Mohd. Zubair Qureshi', 
      initiatedBy: 'Dr. Alok Shah', 
      patientLocation: 'Cardiology OPD', 
      statusCode: 'CONFIRMED', 
      statusText: 'Upcoming Appointment Confirmed',
      isUpcomingAppointment: true 
    },
    { 
      id: 'apt-3', 
      date: 'SUN 13 SEP', 
      time: '11:00 AM', 
      description: 'Upcoming Doctor Consultation - Dr. Sneha Patil', 
      type: 'OP', 
      uhid: 'RFH23241854', 
      patientName: 'Mr. PRATHAMESH SHASHANK KHOCHADE', 
      initiatedBy: 'Dr. Sneha Patil', 
      patientLocation: 'General Medicine OPD', 
      statusCode: 'CONFIRMED', 
      statusText: 'Upcoming Appointment Confirmed',
      isUpcomingAppointment: true 
    },
    { 
      id: 'apt-4', 
      date: 'SUN 13 SEP', 
      time: '02:30 PM', 
      description: 'Upcoming Service - Complete Blood Count (CBC)', 
      type: 'Service', 
      uhid: 'RFH2026003', 
      patientName: 'Anuradha Jadhav', 
      initiatedBy: 'Pathology & Laboratory', 
      patientLocation: 'Central Lab 2F', 
      statusCode: 'SCHEDULED', 
      statusText: 'Diagnostic Test Scheduled',
      isUpcomingAppointment: true 
    },
    { id: '1', date: '7 Sep 2026', time: '12:34 PM', description: 'Admission Request Complete - RFH27AR34', type: 'OP', uhid: 'RFH2026001', patientName: 'Jagdish Ramji Thakkar', initiatedBy: 'Dr. Susheel Bindroo', patientLocation: 'Ward 4B', statusCode: 'AR', statusText: 'Admission Request Raised' },
    { id: '2', date: '8 Sep 2026', time: '03:22 PM', description: 'Admission Request Complete - RFH27AR36', type: 'OP', uhid: 'RFH2026002', patientName: 'Mohd. Zubair Qureshi', initiatedBy: 'Dr. Alok Shah', patientLocation: 'ICU Unit 2', statusCode: 'AR', statusText: 'Admission Request Raised' },
    { id: '3', date: '3 Jan 2026', time: '08:28 AM', description: 'Collect Cashier Scroll - RFH26SN4151', type: '-', uhid: '-', patientName: '-', initiatedBy: 'Ronit Kirtikar', patientLocation: '-', statusCode: 'CS', statusText: 'Cashier Scroll Submitted' },
    { id: '4', date: '3 Jan 2026', time: '02:47 PM', description: 'Collect Cashier Scroll - RFH26SN4152', type: '-', uhid: '-', patientName: '-', initiatedBy: 'Rushikesh Mondkar', patientLocation: '-', statusCode: 'CS', statusText: 'Cashier Scroll Submitted' },
    { id: '5', date: '3 Jan 2026', time: '04:04 PM', description: 'Collect Cashier Scroll - RFH26SN4153', type: '-', uhid: '-', patientName: '-', initiatedBy: 'Kajal Vaishnav', patientLocation: '-', statusCode: 'CS', statusText: 'Cashier Scroll Submitted' }
  ];

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

        // Combine API appointments with default tasks, avoiding duplicate IDs
        const existingIds = new Set(loadedApts.map(a => a.id));
        const combined = [
          ...loadedApts,
          ...this.defaultTasks.filter(dt => !existingIds.has(dt.id))
        ];

        this.tasks.set(combined);
      },
      error: () => {
        this.tasks.set(this.defaultTasks);
      }
    });
  }

  private mapApiAppointmentToTask(apt: any): WorklistTask {
    return {
      id: apt.id ? `apt-${apt.id}` : 'apt-' + Math.floor(Math.random() * 100000),
      date: apt.dateStr || 'SAT 12 SEP',
      time: apt.time || '10:00 AM',
      description: apt.description || `Upcoming Doctor Consultation - ${apt.practitioner || 'Doctor'}`,
      type: apt.type || 'OP',
      uhid: apt.uhid || 'RFH202600' + (apt.id || Math.floor(Math.random() * 9)),
      patientName: apt.patientName || 'Registered Patient',
      initiatedBy: apt.practitioner || 'OPD Clinic',
      patientLocation: 'Main OPD Clinic',
      statusCode: (apt.status === 'CONFIRMED' ? 'CONFIRMED' : 'SCHEDULED') as any,
      statusText: `Upcoming Appointment (${apt.status || 'Confirmed'})`,
      isUpcomingAppointment: true
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

  logout(): void {
    this.toastService.info('Logged out successfully.');
    this.router.navigate(['/login']);
  }

  openHelp(): void {
    this.toastService.info('Help documentation & video tutorials opening...');
  }
}
