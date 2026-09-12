import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center p-6 space-y-3">
      <div class="relative flex items-center justify-center">
        <div class="w-10 h-10 border-4 border-[#df0d0c]/20 border-t-[#df0d0c] rounded-full animate-spin"></div>
      </div>
      <span *ngIf="label" class="text-xs text-slate-500 font-medium">{{ label }}</span>
    </div>
  `
})
export class LoadingSpinnerComponent {
  @Input() label: string = 'Loading data...';
}
