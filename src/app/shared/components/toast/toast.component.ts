import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-[9999] flex flex-col space-y-2 max-w-sm w-full pointer-events-none px-2">
      @for (toast of toastService.toasts(); track toast.id) {
        <div [class]="getToastClasses(toast.type)"
             class="pointer-events-auto flex items-center justify-between p-3 rounded-[3px] shadow-md border text-[11px] font-sans transition-all duration-300 animate-in slide-in-from-top-2 fade-in">
          
          <div class="flex items-center space-x-2.5">
            <!-- Type Icon -->
            @switch (toast.type) {
              @case ('success') {
                <div class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <i class="fa-solid fa-check text-[10px]"></i>
                </div>
              }
              @case ('error') {
                <div class="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <i class="fa-solid fa-xmark text-[10px]"></i>
                </div>
              }
              @case ('warning') {
                <div class="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <i class="fa-solid fa-triangle-exclamation text-[10px]"></i>
                </div>
              }
              @default {
                <div class="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <i class="fa-solid fa-info text-[10px]"></i>
                </div>
              }
            }

            <span class="font-medium text-[#333333] leading-snug">{{ toast.message }}</span>
          </div>

          <!-- Close Button -->
          <button (click)="toastService.remove(toast.id)" 
                  class="text-[#777777] hover:text-[#333333] ml-3 p-1 cursor-pointer rounded transition-colors shrink-0">
            <i class="fa-solid fa-xmark text-[11px]"></i>
          </button>

        </div>
      }
    </div>
  `
})
export class ToastComponent {
  toastService = inject(ToastService);

  getToastClasses(type: 'success' | 'error' | 'info' | 'warning'): string {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-300 text-emerald-950';
      case 'error':
        return 'bg-rose-50 border-rose-300 text-rose-950';
      case 'warning':
        return 'bg-amber-50 border-amber-300 text-amber-950';
      default:
        return 'bg-sky-50 border-sky-300 text-sky-950';
    }
  }
}
