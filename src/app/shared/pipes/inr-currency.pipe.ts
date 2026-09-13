import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'inrCurrency',
  standalone: true
})
export class InrCurrencyPipe implements PipeTransform {
  transform(amount: number | string | null | undefined, showSymbol: boolean = true): string {
    if (amount === null || amount === undefined || isNaN(Number(amount))) {
      return showSymbol ? 'INR 0.00' : '0.00';
    }
    const num = Number(amount);
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(num);

    return showSymbol ? `INR ${formatted}` : formatted;
  }
}
