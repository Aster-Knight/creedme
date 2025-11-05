import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { User } from 'firebase/auth';

@Component({
  selector: 'app-response-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './response-modal.html',
  styleUrls: ['./response-modal.css']
})
export class ResponseModalComponent {
  @Input({ required: true }) question!: any;
  @Input({ required: true }) user!: User;
  @Output() close = new EventEmitter<boolean>(); // Emitirá 'true' si la respuesta fue exitosa

  private apiService = inject(ApiService);

  responseText = '';
  feedback = '';
  isLoading = false;
  isSubmitted = false;

  ngOnInit() {
    if (this.question.hasResponded) {
      this.responseText = this.question.responseText;
      this.feedback = this.question.geminiFeedback;
      this.isSubmitted = true;
    }
  }

  async submitResponse() {
    if (!this.responseText.trim()) return;

    this.isLoading = true;
    const payload = {
      userId: this.user.uid,
      questionId: this.question.questionId,
      responseText: this.responseText
    };

    try {
      const result = await this.apiService.submitResponse(payload).toPromise();
      this.feedback = result?.geminiFeedback || 'No se recibió feedback.';
      this.isSubmitted = true;
      this.close.emit(true); // Notificar que se envió con éxito
    } catch (error) {
      console.error('Error al enviar la respuesta:', error);
      this.feedback = 'Hubo un error al enviar tu respuesta.';
    } finally {
      this.isLoading = false;
    }
  }

  closeModal() {
    this.close.emit(false); // Notificar que se cerró sin enviar
  }
}