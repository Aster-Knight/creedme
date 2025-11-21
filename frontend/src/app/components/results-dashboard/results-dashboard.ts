import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from 'firebase/auth';
import { ApiService } from '../../services/api';
import { Observable } from 'rxjs';
import { LeaderboardModalComponent } from '../leaderboard-modal/leaderboard-modal';

@Component({
  selector: 'app-results-dashboard',
  standalone: true,
  imports: [CommonModule, LeaderboardModalComponent],
  templateUrl: './results-dashboard.html',
  styleUrls: ['./results-dashboard.css']
})
export class ResultsDashboardComponent implements OnInit {
  @Input({ required: true }) user!: User;

  private apiService = inject(ApiService);
  results$!: Observable<any[]>;

  // Propiedades para manejar el estado del modal
  selectedQuestionId: string | null = null;
  selectedQuestionText: string | null = null;

  ngOnInit(): void {
    this.results$ = this.apiService.getResults(this.user.uid);
  }

  showQuestionLeaderboard(questionId: string, questionText: string) {
    this.selectedQuestionId = questionId;
    this.selectedQuestionText = questionText;
  }

  handleModalClose() {
    this.selectedQuestionId = null;
    this.selectedQuestionText = null;
  }
}
