import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { GameViewComponent } from './pages/game-view/game-view';
import { ResultsViewComponent } from './pages/results-view/results-view';
import { LeaderboardViewComponent } from './pages/leaderboard-view/leaderboard-view';
import { AdminPanelComponent } from './pages/admin-panel/admin-panel';
import { authGuard } from './guards/auth-guard';
import { publicGuard } from './guards/public-guard';
import { adminGuard } from './guards/admin-guard';

export const routes: Routes = [
    { 
        path: 'login', 
        component: LoginComponent, 
        canActivate: [publicGuard] 
    },
    { 
        path: 'game', 
        component: GameViewComponent, 
        canActivate: [authGuard] 
    },
    { 
        path: 'results', 
        component: ResultsViewComponent, 
        canActivate: [authGuard] 
    },
    { 
        path: 'leaderboard', 
        component: LeaderboardViewComponent, 
        canActivate: [authGuard] 
    },
    { 
        path: 'admin', 
        component: AdminPanelComponent, 
        canActivate: [authGuard, adminGuard] 
    },
    
    { path: '', redirectTo: 'game', pathMatch: 'full' },
    { path: '**', redirectTo: 'game' }
];