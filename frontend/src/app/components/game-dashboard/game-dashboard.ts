import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '@angular/fire/auth';
import { ApiService, GameState } from '../../services/api';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-game-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-dashboard.html',
  styleUrls: ['./game-dashboard.css']
})
export class GameDashboardComponent implements OnInit {
  @Input({ required: true }) user!: User;
  
  private apiService = inject(ApiService);

  // Observable para el estado del juego
  gameState$!: Observable<GameState>;

  ngOnInit(): void {
    // Al iniciar el componente, llamamos al servicio para obtener el estado del juego
    this.gameState$ = this.apiService.getSetState(this.user.uid);
  }
}