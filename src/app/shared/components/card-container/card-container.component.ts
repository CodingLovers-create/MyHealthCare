import { Component, ContentChild, TemplateRef, Directive } from '@angular/core';
import { CommonModule } from '@angular/common';

@Directive({
  selector: '[appCardHeader]',
  standalone: true
})
export class CardHeaderDirective {}

@Directive({
  selector: '[appCardBody]',
  standalone: true
})
export class CardBodyDirective {}

@Directive({
  selector: '[appCardFooter]',
  standalone: true
})
export class CardFooterDirective {}

@Component({
  selector: 'app-card-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white border border-[#cccccc] rounded-[4px] shadow-2xs overflow-hidden my-2">
      <!-- Dynamic Header Projection via ContentChild TemplateRef & ng-container -->
      <ng-container *ngIf="headerTemplate">
        <div class="bg-[#cadbe5] px-3 py-1.5 border-b border-[#b0c4de]">
          <ng-container *ngTemplateOutlet="headerTemplate"></ng-container>
        </div>
      </ng-container>

      <!-- Dynamic Body Area with ContentChild / ng-content fallback -->
      <div class="p-3">
        <ng-container *ngIf="bodyTemplate; else defaultBody">
          <ng-container *ngTemplateOutlet="bodyTemplate"></ng-container>
        </ng-container>
        <ng-template #defaultBody>
          <ng-content></ng-content>
        </ng-template>
      </div>

      <!-- Dynamic Footer Projection -->
      <ng-container *ngIf="footerTemplate">
        <div class="bg-[#f8f9fa] px-3 py-2 border-t border-[#e0e0e0]">
          <ng-container *ngTemplateOutlet="footerTemplate"></ng-container>
        </div>
      </ng-container>
    </div>
  `
})
export class CardContainerComponent {
  // Querying projected ng-template blocks using @ContentChild
  @ContentChild(CardHeaderDirective, { read: TemplateRef }) headerTemplate?: TemplateRef<any>;
  @ContentChild(CardBodyDirective, { read: TemplateRef }) bodyTemplate?: TemplateRef<any>;
  @ContentChild(CardFooterDirective, { read: TemplateRef }) footerTemplate?: TemplateRef<any>;
}
