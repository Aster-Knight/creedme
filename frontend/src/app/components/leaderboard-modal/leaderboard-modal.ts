import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-leaderboard-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaderboard-modal.html',
  styleUrls: ['./leaderboard-modal.css']
})
export class LeaderboardModalComponent implements OnInit {
  @Input({ required: true }) questionId!: string;
  @Input({ required: true }) questionText!: string;
  @Output() close = new EventEmitter<void>();

  private apiService = inject(ApiService);
  leaderboard$!: Observable<any[]>;

  ngOnInit(): void {
    this.leaderboard$ = this.apiService.getLeaderboards({ 
      type: 'question', 
      questionId: this.questionId 
    });
  }

  closeModal() {
    this.close.emit();
  }
}