import { Component, inject } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { AuthService } from './services/auth';
import { LoginComponent } from './components/login/login';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgIf, AsyncPipe, LoginComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class AppComponent {
  private authService = inject(AuthService);
  
  // Exponemos el observable del estado de autenticación a la plantilla
  user$ = this.authService.authState$;

  // Método para cerrar sesión
  logout() {
    this.authService.logout();
  }
}