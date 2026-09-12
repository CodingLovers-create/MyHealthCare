import { Injectable, signal } from '@angular/core';

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
  toasts = signal<ToastNotification[]>([]);

  showSuccess(title: string, message: string): void {
    this.addToast('success', title, message);
  }

  showError(title: string, message: string): void {
    this.addToast('error', title, message);
  }

  showInfo(title: string, message: string): void {
    this.addToast('info', title, message);
  }

  removeToast(id: string): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }

  private addToast(type: ToastNotification['type'], title: string, message: string): void {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: ToastNotification = { id, type, title, message };
    this.toasts.update(current => [...current, toast]);

    setTimeout(() => this.removeToast(id), 4000);
  }
}
