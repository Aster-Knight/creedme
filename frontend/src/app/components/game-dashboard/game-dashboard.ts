import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '@angular/fire/auth';
import { ApiService, GameState } from '../../services/api';
import { Observable, tap } from 'rxjs';
import { ResponseModalComponent } from '../response-modal/response-modal';

@Component({
  selector: 'app-game-dashboard',
  standalone: true,
  imports: [CommonModule, ResponseModalComponent],
  templateUrl: './game-dashboard.html',
  styleUrls: ['./game-dashboard.css']
})
export class GameDashboardComponent implements OnInit {
  @Input({ required: true }) user!: User;
  
  private apiService = inject(ApiService);

  gameState$: Observable<GameState> | undefined;
  localGameState: GameState | undefined;

  selectedQuestion: any = null;

  ngOnInit(): void {
    this.loadGameState();
  }

  loadGameState() {
    this.gameState$ = this.apiService.getSetState(this.user.uid).pipe(
      tap(state => this.localGameState = state) // Guardamos una copia local
    );
  }

  openModal(question: any) {
    this.selectedQuestion = question;
  }

  handleModalClose(isSuccess: boolean) {
    this.selectedQuestion = null;
    // Si la respuesta fue exitosa, recargamos el estado del juego para reflejar los cambios
    if (isSuccess) {
      this.loadGameState();
    }
  }
}
