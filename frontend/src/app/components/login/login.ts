import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common'; // Importar NgIf
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf], // Añadir NgIf aquí
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';

  private authService = inject(AuthService);

  async login() {
    this.error = '';
    try {
      await this.authService.login(this.email, this.password);
    } catch (e: any) {
      this.error = e.message;
    }
  }

  async register() {
    this.error = '';
    try {
      await this.authService.register(this.email, this.password);
    } catch (e: any) {
      this.error = e.message;
    }
  }
}