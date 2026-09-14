import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
}

const DEFAULT_TOAST_DURATION = 3500;

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<Toast[]>([]);

  show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', title?: string, duration = DEFAULT_TOAST_DURATION): void {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, type, title, message, duration };
    this.toasts.update(current => [...current, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  success(message: string, title?: string, duration = DEFAULT_TOAST_DURATION): void {
    this.show(message, 'success', title, duration);
  }

  error(message: string, title?: string, duration = DEFAULT_TOAST_DURATION): void {
    this.show(message, 'error', title, duration);
  }

  info(message: string, title?: string, duration = DEFAULT_TOAST_DURATION): void {
    this.show(message, 'info', title, duration);
  }

  warning(message: string, title?: string, duration = DEFAULT_TOAST_DURATION): void {
    this.show(message, 'warning', title, duration);
  }

  showSuccess(title: string, message: string): void {
    this.success(message, title);
  }

  showError(title: string, message: string): void {
    this.error(message, title);
  }

  showInfo(title: string, message: string): void {
    this.info(message, title);
  }

  showWarning(title: string, message: string): void {
    this.warning(message, title);
  }

  remove(id: string): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
