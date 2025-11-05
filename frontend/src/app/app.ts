import { Component, inject } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { AuthService } from './services/auth';
import { LoginComponent } from './components/login/login';
import { GameDashboardComponent } from './components/game-dashboard/game-dashboard';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgIf, AsyncPipe, LoginComponent, GameDashboardComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class AppComponent {
  private authService = inject(AuthService);
  
  user$ = this.authService.authState$;

  logout() {
    this.authService.logout();
  }
}