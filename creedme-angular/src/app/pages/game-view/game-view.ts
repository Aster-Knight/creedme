import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, GameState } from '../../services/api.service';

@Component({
  selector: 'app-game-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './game-view.html',
  styleUrls: ['./game-view.css']
})
export class GameViewComponent implements OnInit {
  gameState: GameState | null = null;
  error: string | null = null;
  isLoading = true;

  isModalOpen = false;
  currentQuestion: any = null;
  responseText = '';
  isSubmitting = false;

  constructor(private apiService: ApiService) {}

  async ngOnInit() {
    try {
      this.gameState = await this.apiService.getGameState();
    } catch (err) {
      this.error = "No se pudo cargar el estado del juego. Inténtalo de nuevo más tarde.";
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }

  openResponseModal(question: any) {
    this.currentQuestion = question;
    this.responseText = question.responseText || '';
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.currentQuestion = null;
    this.responseText = '';
  }

  async handleResponseSubmit() {
    if (!this.responseText.trim() || !this.currentQuestion) return;

    this.isSubmitting = true;
    try {
      const result = await this.apiService.submitResponse(this.currentQuestion.questionId, this.responseText);
      this.currentQuestion.hasResponded = true;
      this.currentQuestion.responseText = this.responseText;
      this.currentQuestion.geminiFeedback = result.geminiFeedback;
    } catch (error) {
      console.error("Error al enviar la respuesta:", error);
      alert("Hubo un problema al enviar tu respuesta.");
    } finally {
      this.isSubmitting = false;
    }
  }
}
