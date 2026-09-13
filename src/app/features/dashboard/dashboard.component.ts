import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { ToastService } from '../../core/services/toast.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { AuthService } from '../../core/services/auth.service';

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
  statusCode: 'AR' | 'CS' | 'IP' | 'PD';
  statusText: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  public authService = inject(AuthService);
  activeModuleTab = signal<string>('MyDesk');
  activeWorklistTab = signal<string>('Worklist');
  searchQuery = signal<string>('');
  currentPage = signal<number>(1);
  totalPages = signal<number>(390);

  moduleTabs = computed(() => this.authService.allowedModules());

  tasks = signal<WorklistTask[]>([
    { id: '1', date: '7 Sep 2026', time: '12:34 PM', description: 'Admission Request Complete - RFH27AR34', type: 'OP', uhid: '0010723243', patientName: 'Jagdish Ramji Thakkar', initiatedBy: 'Dr. Susheel Bindroo', patientLocation: '-', statusCode: 'AR', statusText: 'Admission Request Raised' },
    { id: '2', date: '8 Sep 2026', time: '03:22 PM', description: 'Admission Request Complete - RFH27AR36', type: 'OP', uhid: '0010109093', patientName: 'Mohd. Zubair Azizur-Rehman Qureshi', initiatedBy: 'Dr. Alok Shah', patientLocation: '-', statusCode: 'AR', statusText: 'Admission Request Raised' },
    { id: '3', date: '3 Jan 2026', time: '08:28 AM', description: 'Collect Cashier Scroll - RFH26SN4151', type: '-', uhid: '-', patientName: '-', initiatedBy: 'Ronit Kirtikar', patientLocation: '-', statusCode: 'CS', statusText: 'Cashier Scroll Submitted' },
    { id: '4', date: '3 Jan 2026', time: '02:47 PM', description: 'Collect Cashier Scroll - RFH26SN4152', type: '-', uhid: '-', patientName: '-', initiatedBy: 'Rushikesh Mondkar', patientLocation: '-', statusCode: 'CS', statusText: 'Cashier Scroll Submitted' },
    { id: '5', date: '3 Jan 2026', time: '04:04 PM', description: 'Collect Cashier Scroll - RFH26SN4153', type: '-', uhid: '-', patientName: '-', initiatedBy: 'Kajal Vaishnav', patientLocation: '-', statusCode: 'CS', statusText: 'Cashier Scroll Submitted' },
    { id: '6', date: '3 Jan 2026', time: '04:19 PM', description: 'Collect Cashier Scroll - RFH26SN4154', type: '-', uhid: '-', patientName: '-', initiatedBy: 'Pooja Dhanecha', patientLocation: '-', statusCode: 'CS', statusText: 'Cashier Scroll Submitted' },
    { id: '7', date: '3 Jan 2026', time: '04:19 PM', description: 'Collect Cashier Scroll - RFH26SN4155', type: '-', uhid: '-', patientName: '-', initiatedBy: 'Rufi Khan', patientLocation: '-', statusCode: 'CS', statusText: 'Cashier Scroll Submitted' },
    { id: '8', date: '3 Jan 2026', time: '04:44 PM', description: 'Collect Cashier Scroll - RFH26SN4156', type: '-', uhid: '-', patientName: '-', initiatedBy: 'Atul Pol', patientLocation: '-', statusCode: 'CS', statusText: 'Cashier Scroll Submitted' },
    { id: '9', date: '3 Jan 2026', time: '04:44 PM', description: 'Collect Cashier Scroll - RFH26SN4157', type: '-', uhid: '-', patientName: '-', initiatedBy: 'Anjli Sharma', patientLocation: '-', statusCode: 'CS', statusText: 'Cashier Scroll Submitted' },
    { id: '10', date: '3 Jan 2026', time: '05:10 PM', description: 'Collect Cashier Scroll - RFH26SN4158', type: '-', uhid: '-', patientName: '-', initiatedBy: 'Shivangi Kedare', patientLocation: '-', statusCode: 'CS', statusText: 'Cashier Scroll Submitted' },
    { id: '11', date: '3 Jan 2026', time: '05:42 PM', description: 'Collect Cashier Scroll - RFH26SN4159', type: '-', uhid: '-', patientName: '-', initiatedBy: 'Surima Debbarma', patientLocation: '-', statusCode: 'CS', statusText: 'Cashier Scroll Submitted' },
    { id: '12', date: '3 Jan 2026', time: '05:53 PM', description: 'Collect Cashier Scroll - RFH26SN4160', type: '-', uhid: '-', patientName: '-', initiatedBy: 'Anuradha Jadhav', patientLocation: '-', statusCode: 'CS', statusText: 'Cashier Scroll Submitted' },
    { id: '13', date: '3 Jan 2026', time: '05:54 PM', description: 'Collect Cashier Scroll - RFH26SN4161', type: '-', uhid: '-', patientName: '-', initiatedBy: 'Kunal Parab', patientLocation: '-', statusCode: 'CS', statusText: 'Cashier Scroll Submitted' },
    { id: '14', date: '3 Jan 2026', time: '06:16 PM', description: 'Collect Cashier Scroll - RFH26SN4162', type: '-', uhid: '-', patientName: '-', initiatedBy: 'Ashmita Rao', patientLocation: '-', statusCode: 'CS', statusText: 'Cashier Scroll Submitted' },
    { id: '15', date: '3 Jan 2026', time: '06:30 PM', description: 'Collect Cashier Scroll - RFH26SN4163', type: '-', uhid: '-', patientName: '-', initiatedBy: 'Siddhi Kolekar', patientLocation: '-', statusCode: 'CS', statusText: 'Cashier Scroll Submitted' }
  ]);

  filteredTasks = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.tasks();
    return this.tasks().filter(t => 
      t.description.toLowerCase().includes(q) ||
      t.patientName.toLowerCase().includes(q) ||
      t.initiatedBy.toLowerCase().includes(q) ||
      t.uhid.toLowerCase().includes(q) ||
      t.statusText.toLowerCase().includes(q)
    );
  });

  constructor(
    private router: Router, 
    private toastService: ToastService,
    public sidebarService: SidebarService
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
    } else if (tabId === 'VitalsRecording') {
      this.router.navigate(['/vitals-recording']);
    } else if (tabId === 'DoctorPatientList') {
      this.router.navigate(['/doctor-patient-list']);
    }
  }

  selectWorklistTab(tab: string): void {
    this.activeWorklistTab.set(tab);
  }

  refreshTasks(): void {
    const current = [...this.tasks()];
    this.tasks.set(current.reverse());
    this.toastService.info('Task worklist refreshed.');
  }

  logout(): void {
    this.toastService.info('Logged out successfully.');
    this.router.navigate(['/login']);
  }

  openHelp(): void {
    this.toastService.info('Help documentation & video tutorials opening...');
  }
}
