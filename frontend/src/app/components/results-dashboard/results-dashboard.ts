import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from 'firebase/auth';
import { ApiService } from '../../services/api';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-results-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './results-dashboard.html',
  styleUrls: ['./results-dashboard.css']
})
export class ResultsDashboardComponent implements OnInit {
  @Input({ required: true }) user!: User;

  private apiService = inject(ApiService);
  results$!: Observable<any[]>;

  // Propiedades para manejar la vista expandida
  selectedQuestionId: string | null = null;
  leaderboard$: Observable<any[]> | null = null;

  ngOnInit(): void {
    this.results$ = this.apiService.getResults(this.user.uid);
  }

  toggleQuestionLeaderboard(questionId: string) {
    // Si se hace clic en la misma pregunta, se cierra la vista
    if (this.selectedQuestionId === questionId) {
      this.selectedQuestionId = null;
      this.leaderboard$ = null;
    } else {
      // Si es una nueva pregunta, se abre y se cargan los datos
      this.selectedQuestionId = questionId;
      this.leaderboard$ = this.apiService.getLeaderboards({ 
        type: 'question', 
        questionId: this.selectedQuestionId 
      });
    }
  }
}