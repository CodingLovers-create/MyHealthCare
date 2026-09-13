import { Component, Input, inject, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, UserProfile } from '../../../core/services/auth.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { ToastService } from '../../../core/services/toast.service';
import { Subscription, Observable } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Input() activeModule: string = '';

  public authService = inject(AuthService);
  public sidebarService = inject(SidebarService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // Observable stream from AuthService BehaviorSubject
  public currentUser$: Observable<UserProfile | null> = this.authService.currentUser$;
  public userProfile: UserProfile | null = null;
  private userSub?: Subscription;

  moduleTabs = computed(() => this.authService.allowedModules());

  ngOnInit(): void {
    // Subscribe to BehaviorSubject currentUser$ stream
    this.userSub = this.authService.currentUser$.subscribe({
      next: (user) => {
        this.userProfile = user;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  selectModuleTab(tabId: string): void {
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
    }
  }

  logout(): void {
    this.toastService.info('Logged out successfully.');
    this.authService.logout();
  }

  openHelp(): void {
    this.toastService.info('Help documentation & video tutorials opening...');
  }
}
