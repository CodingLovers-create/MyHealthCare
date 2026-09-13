import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'uhidFormat',
  standalone: true
})
export class UhidFormatPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return 'N/A';
    const clean = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (clean.startsWith('RFH')) {
      const numPart = clean.substring(3);
      if (numPart.length >= 7) {
        return `RFH-${numPart.substring(0, 4)}-${numPart.substring(4)}`;
      }
      return `RFH-${numPart}`;
    }
    return value;
  }
}
