import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-subheader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white px-4 py-2 border-b border-[#cccccc] flex items-center justify-between shrink-0">
      <div class="flex items-center space-x-6">
        @if (title) {
          <h1 class="text-[16px] font-bold text-[#222222] leading-none">{{ title }}</h1>
        }
        <ng-content select="[subheader-left]"></ng-content>
      </div>
      <div class="flex items-center space-x-4 text-[11px] font-medium text-[#333333]">
        <ng-content select="[subheader-right]"></ng-content>
        <ng-content></ng-content>
      </div>
    </div>
  `
})
export class SubheaderComponent {
  @Input() title: string = '';
}
