import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe, NgIf, NgClass } from '@angular/common';
import { AuthService } from './services/auth';
import { ThemeService } from './services/theme';
import { LoginComponent } from './components/login/login';
import { GameDashboardComponent } from './components/game-dashboard/game-dashboard';
import { ResultsDashboardComponent } from './components/results-dashboard/results-dashboard';
import { GlobalLeaderboardComponent } from './components/global-leaderboard/global-leaderboard';
import { AdminPanelComponent } from './components/admin-panel/admin-panel';
import { InstructionsPanelComponent } from './components/instructions-panel/instructions-panel';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    NgIf, 
    AsyncPipe, 
    NgClass,
    LoginComponent, 
    GameDashboardComponent,
    ResultsDashboardComponent,
    GlobalLeaderboardComponent,
    AdminPanelComponent,
    InstructionsPanelComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  public themeService = inject(ThemeService);
  
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