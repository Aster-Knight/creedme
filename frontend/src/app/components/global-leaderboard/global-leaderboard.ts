import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-global-leaderboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './global-leaderboard.html',
  styleUrls: ['./global-leaderboard.css']
})
export class GlobalLeaderboardComponent implements OnInit {
  private apiService = inject(ApiService);
  leaderboard$!: Observable<any[]>;

  ngOnInit(): void {
    this.leaderboard$ = this.apiService.getLeaderboards({ type: 'global' });
  }
}