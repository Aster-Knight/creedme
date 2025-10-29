import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private _isDarkMode = new BehaviorSubject<boolean>(false);
  isDarkMode$ = this._isDarkMode.asObservable();

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    // Opcional: Comprobar preferencia del sistema o localStorage al iniciar
    const storedPreference = localStorage.getItem('dark-mode');
    if (storedPreference) {
      this.setDarkMode(storedPreference === 'true');
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setDarkMode(prefersDark);
    }
  }

  setDarkMode(isDark: boolean) {
    this._isDarkMode.next(isDark);
    localStorage.setItem('dark-mode', isDark.toString());
    if (isDark) {
      this.renderer.addClass(document.body, 'dark-mode');
    } else {
      this.renderer.removeClass(document.body, 'dark-mode');
    }
  }

  toggleDarkMode() {
    this.setDarkMode(!this._isDarkMode.value);
  }
}
