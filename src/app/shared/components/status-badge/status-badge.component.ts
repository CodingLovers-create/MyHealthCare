import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeStatus = 'success' | 'warning' | 'error' | 'info' | 'active' | 'pending' | 'completed' | 'draft';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [ngClass]="[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider',
      statusClasses[status] || statusClasses['info']
    ]">
      <span class="w-1.5 h-1.5 rounded-full mr-1.5" [ngClass]="dotClasses[status] || dotClasses['info']"></span>
      <ng-content></ng-content>
    </span>
  `
})
export class StatusBadgeComponent {
  @Input() status: BadgeStatus = 'info';

  statusClasses: Record<string, string> = {
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    error: 'bg-red-50 text-red-700 border border-red-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
    draft: 'bg-slate-100 text-slate-600 border border-slate-200'
  };

  dotClasses: Record<string, string> = {
    success: 'bg-emerald-500',
    active: 'bg-emerald-500',
    completed: 'bg-emerald-500',
    warning: 'bg-amber-500',
    pending: 'bg-amber-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    draft: 'bg-slate-400'
  };
}
