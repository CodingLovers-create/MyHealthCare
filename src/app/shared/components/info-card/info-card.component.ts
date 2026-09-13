import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-info-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white border border-[#cccccc] rounded-[4px] shadow-2xs overflow-hidden my-2.5">
      <!-- Multi-Slot Content Projection: Header -->
      <div class="bg-[#cadbe5] px-3.5 py-2 border-b border-[#b0c4de]">
        <ng-content select="[card-title]"></ng-content>
      </div>

      <!-- Multi-Slot Content Projection: Main Body -->
      <div class="p-3 text-[11px] text-[#333333]">
        <ng-content select="[card-body]"></ng-content>
        
        <!-- Default Single-Slot Content Projection for any un-named child nodes -->
        <ng-content></ng-content>
      </div>

      <!-- Multi-Slot Content Projection: Footer Actions -->
      <div class="bg-[#f8f9fa] px-3.5 py-2 border-t border-[#e0e0e0] flex items-center justify-between">
        <ng-content select="[card-actions]"></ng-content>
      </div>
    </div>
  `
})
export class InfoCardComponent {}
