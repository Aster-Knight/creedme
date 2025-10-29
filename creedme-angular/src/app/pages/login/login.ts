import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div id="auth-container">
        <p>Por favor, inicia sesión o regístrate para participar.</p>
    </div>
    <div id="auth-modal">
        <div class="modal-content">
            <h3>Acceso de Jugador</h3>
            <input type="email" [(ngModel)]="email" placeholder="Correo electrónico">
            <input type="password" [(ngModel)]="password" placeholder="Contraseña">
            <p id="auth-error" *ngIf="errorMessage">{{ errorMessage }}</p>
            <div class="modal-actions">
                <button (click)="login()">Iniciar Sesión</button>
                <button (click)="register()">Registrarse</button>
            </div>
        </div>
    </div>
  `,
  styleUrls: ['./login.css']
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  async login() {
    this.errorMessage = '';
    try {
      await this.authService.login(this.email, this.password);
      this.router.navigate(['/game']);
    } catch (error: any) {
      this.errorMessage = error.message;
    }
  }

  async register() {
    this.errorMessage = '';
    try {
      await this.authService.register(this.email, this.password);
      this.router.navigate(['/game']);
    } catch (error: any) { 
      this.errorMessage = error.message;
    }
  }
}