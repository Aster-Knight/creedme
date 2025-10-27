import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'eloChange',
  standalone: true
})
export class EloChangePipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {}

  transform(value: number | undefined | null): SafeHtml {
    if (value == null) {
      return '';
    }

    const sign = value > 0 ? '+' : '';
    const color = value > 0 ? 'text-success' : (value < 0 ? 'text-danger' : 'text-muted');
    const formattedValue = value.toFixed(1);

    const html = `<span class="${color}">${sign}${formattedValue}</span>`;

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

}