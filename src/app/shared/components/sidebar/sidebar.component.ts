import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SidebarService } from '../../../core/services/sidebar.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';

export interface SidebarMenuItem {
  label: string;
  icon: string;
  route?: string;
  badge?: string;
  badgeColor?: string;
  moduleId: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent {

  allSections: SidebarMenuItem[] = [
    { label: 'MyDesk / Worklist', icon: 'fa-desktop', route: '/dashboard', badge: '5841', badgeColor: 'bg-[#d93848]', moduleId: 'MyDesk' },
    { label: 'MagicSearch', icon: 'fa-wand-magic-sparkles', route: '/magic-search', badge: 'HOT', badgeColor: 'bg-[#0088cc]', moduleId: 'MagicSearch' },
    { label: 'Patient Registration', icon: 'fa-user-plus', route: '/registration', moduleId: 'Registration' },
    { label: 'Doctor Appointment', icon: 'fa-calendar-check', route: '/doctor-appointment', moduleId: 'DoctorAppointment' },
    { label: 'OP Billing & Cashier', icon: 'fa-file-invoice-dollar', route: '/op-billing', moduleId: 'OpBilling' },
    { label: 'Vitals Recording', icon: 'fa-heart-pulse', route: '/vitals-recording', moduleId: 'VitalsRecording' },
    { label: 'OPD Queue / Consultation', icon: 'fa-stethoscope', route: '/doctor-patient-list', moduleId: 'DoctorPatientList' }
  ];

  filteredMenuItems = computed(() => {
    const allowedIds = this.authService.allowedModules().map(m => m.id);
    return this.allSections.filter(item => allowedIds.includes(item.moduleId));
  });

  constructor(
    public sidebarService: SidebarService,
    public authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  navigate(item: SidebarMenuItem): void {
    this.sidebarService.close();
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  logout(): void {
    this.sidebarService.close();
    this.authService.logout();
    this.toastService.info('Logged out successfully.');
  }
}
