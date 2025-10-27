import { RouterModule, Router } from '@angular/router'; // Para el routing
import { Observable } from 'rxjs'; // Para los observables ($)
import { AuthService } from '../../services/auth.service'; // Para el servicio de autenticación
import { UserDataService, UserProfile } from '../../services/user-data.service'; // Para los datos de usuario

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container-fluid">
        <a class="navbar-brand" routerLink="/game">CreedMe</a>
        <div class="form-check form-switch ms-3">
          <input class="form-check-input" type="checkbox" role="switch" id="themeSwitch" [checked]="isDarkMode$ | async" (change)="toggleTheme()">
          <label class="form-check-label text-light" for="themeSwitch">Dark Mode</label>
        </div>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <a class="nav-link" routerLink="/game" routerLinkActive="active">Juego</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/results" routerLinkActive="active">Resultados</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/leaderboard" routerLinkActive="active">Ranking</a>
            </li>
            <li class="nav-item" *ngIf="(userProfile$ | async) as userProfile">
              <a class="nav-link" routerLink="/admin" routerLinkActive="active">Admin</a>
            </li>
          </ul>
          <div class="d-flex" *ngIf="userProfile$ | async as userProfile; else loginButton">
            <span class="navbar-text me-3">
              Jugador: <b>{{ userProfile.username }}</b> ({{ userProfile.eloRating | number:'1.0-0' }})
            </span>
            <button class="btn btn-outline-light" (click)="logout()">Cerrar Sesión</button>
          </div>
          <ng-template #loginButton>
            <a class="btn btn-outline-light" routerLink="/login">Iniciar Sesión</a>
          </ng-template>
        </div>
      </div>
    </nav>
  `,
  styleUrls: []
})
export class HeaderComponent {
  userProfile$: Observable<UserProfile | null>;
  isDarkMode$: Observable<boolean>;

  constructor(
    private authService: AuthService, 
    private userDataService: UserDataService, 
    private router: Router,
    private themeService: ThemeService
  ) {
    this.userProfile$ = this.userDataService.currentUserProfile$;
    this.isDarkMode$ = this.themeService.isDarkMode$;
  }

  toggleTheme() {
    this.themeService.toggleDarkMode();
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
