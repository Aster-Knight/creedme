import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from 'firebase/auth';
import { ApiService } from '../../services/api';
import { Observable } from 'rxjs';

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

  ngOnInit(): void {
    this.results$ = this.apiService.getResults(this.user.uid);
  }

  // En el futuro, aquí pondremos la lógica para abrir el modal del ranking de una pregunta
  showQuestionLeaderboard(questionId: string, questionText: string) {
    console.log(`Mostrar ranking para la pregunta: ${questionId} - ${questionText}`);
    // Lógica del modal irá aquí
  }
}