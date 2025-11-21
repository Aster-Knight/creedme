import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'eloChange',
  standalone: true
})
export class EloChangePipe implements PipeTransform {

  private sanitizer = inject(DomSanitizer);

  transform(value: number | undefined | null): SafeHtml {
    if (value === undefined || value === null) {
      return '';
    }

    const roundedValue = Math.round(value);
    let color: string;
    let text: string;

    if (roundedValue > 0) {
      color = 'green';
      text = `+${roundedValue}`;
    } else if (roundedValue < 0) {
      color = 'red';
      text = `${roundedValue}`; // El signo negativo ya está incluido
    } else {
      color = 'grey';
      text = '0';
    }

    const html = `<span style="color: ${color}; font-weight: bold;">${text}</span>`;
    
    // Usamos DomSanitizer para decirle a Angular que este HTML es seguro
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}