import { Directive, ElementRef, Input, OnChanges, Renderer2, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appPriorityHighlight]',
  standalone: true
})
export class PriorityHighlightDirective implements OnChanges {
  @Input() appPriorityHighlight: boolean = false;
  @Input() priorityColor: string = '#d93848';

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.appPriorityHighlight) {
      this.renderer.setStyle(this.el.nativeElement, 'border-left', `3.5px solid ${this.priorityColor}`);
      this.renderer.setStyle(this.el.nativeElement, 'box-shadow', '0 2px 6px rgba(217, 56, 72, 0.12)');
    } else {
      this.renderer.removeStyle(this.el.nativeElement, 'border-left');
      this.renderer.removeStyle(this.el.nativeElement, 'box-shadow');
    }
  }
}
