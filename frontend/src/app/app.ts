import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { AuthService } from './services/auth';
import { LoginComponent } from './components/login/login';
import { GameDashboardComponent } from './components/game-dashboard/game-dashboard';
import { ResultsDashboardComponent } from './components/results-dashboard/results-dashboard';
import { GlobalLeaderboardComponent } from './components/global-leaderboard/global-leaderboard';
import { AdminPanelComponent } from './components/admin-panel/admin-panel'; // Importar
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    NgIf, 
    AsyncPipe, 
    LoginComponent, 
    GameDashboardComponent,
    ResultsDashboardComponent,
    GlobalLeaderboardComponent,
    AdminPanelComponent // Añadir
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  
  user$ = this.authService.authState$;
  isAdmin$ = new BehaviorSubject<boolean>(false);

  ngOnInit() {
    this.user$.subscribe(user => {
      if (user) {
        this.authService.isAdmin().then(isAdmin => this.isAdmin$.next(isAdmin));
      } else {
        this.isAdmin$.next(false);
      }
    });
  }

  logout() {
    this.authService.logout();
  }
}