import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService, UserRoleType } from '../../../core/services/auth.service';

export interface CertificationBadge {
  id: string;
  title: string;
  subText: string;
  icon?: string;
  textBadge?: string;
  iconBg: string;
  borderColor: string;
  titleColor: string;
  isTextBadge?: boolean;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  public authService = inject(AuthService);

  selectedRole = signal<UserRoleType>('admin');

  credentials = {
    identifier: '',
    password: ''
  };

  currentTime: string = '';
  currentDate: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  badges: CertificationBadge[] = [
    { id: 'abdm', title: 'ABDM', subText: 'M1 M2 M3', icon: 'fa-solid fa-check', iconBg: 'bg-emerald-600', borderColor: 'border-slate-200', titleColor: 'text-emerald-800' },
    { id: 'iso27001-2013', title: 'ISO', subText: '27001:2013', icon: 'fa-solid fa-award', iconBg: 'bg-amber-500', borderColor: 'border-amber-300', titleColor: 'text-amber-900' },
    { id: 'cmmi', title: 'CMMI', subText: 'CMMIDEV / 3', textBadge: 'CMMI', iconBg: 'bg-blue-700', borderColor: 'border-blue-300 bg-blue-50/50', titleColor: 'text-blue-900', isTextBadge: true },
    { id: 'iso20000', title: 'ISO', subText: '20000-1:2018', textBadge: 'ISO', iconBg: 'bg-amber-600', borderColor: 'border-amber-300', titleColor: 'text-amber-900', isTextBadge: true },
    { id: 'iso9001', title: 'ISO', subText: '9001:2015', textBadge: 'ISO', iconBg: 'bg-amber-500', borderColor: 'border-amber-300', titleColor: 'text-amber-900', isTextBadge: true },
    { id: 'iec62304', title: 'IEC', subText: '62304:2006', textBadge: 'IEC', iconBg: 'bg-cyan-700', borderColor: 'border-cyan-300 bg-cyan-50/50', titleColor: 'text-cyan-900', isTextBadge: true },
    { id: 'iso27001-2022', title: 'ISO', subText: '27001:2022', icon: 'fa-solid fa-shield', iconBg: 'bg-slate-700', borderColor: 'border-slate-300', titleColor: 'text-slate-800' }
  ];

  private timer: any;

  ngOnInit(): void {
    this.updateClock();
    this.timer = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  updateClock(): void {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    this.currentTime = `${hours}:${minutes}`;

    const month = now.toLocaleString('en-US', { month: 'long' });
    const day = now.getDate();
    const ordinal = this.getOrdinalSuffix(day);
    const year = now.getFullYear();
    this.currentDate = `${month} ${day}${ordinal}, ${year}`;
  }

  getOrdinalSuffix(day: number): string {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1:  return 'st';
      case 2:  return 'nd';
      case 3:  return 'rd';
      default: return 'th';
    }
  }

  onLogin(form?: NgForm): void {
    const identifier = this.credentials.identifier.trim();
    const password = this.credentials.password.trim();

    if (!identifier) {
      this.errorMessage = 'Please enter your username.';
      this.toastService.warning(this.errorMessage);
      return;
    }

    if (!password) {
      this.errorMessage = 'Please enter your password.';
      this.toastService.warning(this.errorMessage);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.authenticateUser(identifier, password).subscribe({
      next: ({ user, targetRoute }) => {
        this.isLoading = false;
        this.toastService.success(`Welcome ${user.name}! Logged in as ${user.roleTitle}.`);
        
        // If returnUrl query param is present, navigate back to original destination page
        const returnUrl = this.route.snapshot.queryParams['returnUrl'];
        const destination = returnUrl || targetRoute;
        this.router.navigateByUrl(destination);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.message || 'Access Denied: Invalid username or password.';
        this.toastService.error(this.errorMessage);
      }
    });
  }
}
