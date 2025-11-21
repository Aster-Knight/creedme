import { DOCUMENT } from '@angular/common';
import { Injectable, Inject, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private currentTheme: 'light' | 'dark';

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private rendererFactory: RendererFactory2
  ) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
    // Carga el tema inicial desde localStorage o usa 'light' por defecto
    this.currentTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    this.updateBodyClass();
  }

  private updateBodyClass() {
    if (this.currentTheme === 'dark') {
      this.renderer.addClass(this.document.body, 'dark-mode');
    } else {
      this.renderer.removeClass(this.document.body, 'dark-mode');
    }
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', this.currentTheme);
    this.updateBodyClass();
  }

  getCurrentTheme(): 'light' | 'dark' {
    return this.currentTheme;
  }
}