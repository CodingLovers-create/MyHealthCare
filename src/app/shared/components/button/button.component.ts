import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button [type]="type"
            [disabled]="disabled || loading"
            (click)="btnClick.emit($event)"
            [ngClass]="[
              baseClasses,
              variantClasses[variant],
              sizeClasses[size],
              disabled || loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
            ]">
      <i *ngIf="loading" class="fa-solid fa-circle-notch fa-spin mr-2"></i>
      <i *ngIf="icon && !loading" [class]="icon + ' mr-2'"></i>
      <ng-content></ng-content>
    </button>
  `
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() icon?: string;

  @Output() btnClick = new EventEmitter<MouseEvent>();

  baseClasses = 'inline-flex items-center justify-center font-semibold tracking-wider uppercase rounded-[2px] transition-all duration-150 active:scale-[0.98] focus:outline-none';

  variantClasses = {
    primary: 'bg-[#d93848] hover:bg-[#c02a3a] text-white shadow-xs',
    secondary: 'bg-[#52555a] hover:bg-[#3f4348] text-white shadow-xs',
    outline: 'bg-white border border-[#d93848] text-[#d93848] hover:bg-red-50',
    ghost: 'bg-white border border-[#cccccc] text-[#333333] hover:bg-slate-100',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
  };

  sizeClasses = {
    sm: 'px-3 py-1 text-[11px]',
    md: 'px-5 py-1.5 text-xs',
    lg: 'px-8 py-2 text-xs'
  };
}

