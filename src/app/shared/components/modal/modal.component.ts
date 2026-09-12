import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-scale-up">
        
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 class="text-base font-bold text-[#0a1c36]">{{ title }}</h3>
          <button (click)="closeModal()" class="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 text-sm text-slate-700">
          <ng-content></ng-content>
        </div>

        <!-- Modal Footer -->
        <div *ngIf="showFooter" class="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
          <button (click)="closeModal()" class="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded">
            Cancel
          </button>
          <button (click)="confirm.emit()" class="px-5 py-2 text-xs font-semibold bg-[#df0d0c] text-white rounded hover:bg-[#b80a09]">
            {{ confirmText }}
          </button>
        </div>

      </div>
    </div>
  `
})
export class ModalComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = 'Dialog';
  @Input() confirmText: string = 'Confirm';
  @Input() showFooter: boolean = true;

  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() confirm = new EventEmitter<void>();

  closeModal(): void {
    this.isOpen = false;
    this.isOpenChange.emit(false);
  }
}
