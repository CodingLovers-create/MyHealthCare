import { Injectable, inject } from '@angular/core';
import { ToastService } from './toast.service';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private toastService = inject(ToastService);

  showSuccess(title: string, message: string): void {
    this.toastService.success(title ? `${title}: ${message}` : message);
  }

  showError(title: string, message: string): void {
    this.toastService.error(title ? `${title}: ${message}` : message);
  }

  showInfo(title: string, message: string): void {
    this.toastService.info(title ? `${title}: ${message}` : message);
  }

  showWarning(title: string, message: string): void {
    this.toastService.warning(title ? `${title}: ${message}` : message);
  }

  removeToast(id: string): void {
    this.toastService.remove(id);
  }
}
