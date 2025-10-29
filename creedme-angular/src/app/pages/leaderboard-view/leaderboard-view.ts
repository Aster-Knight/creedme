import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-leaderboard-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section id="global-leaderboard-section">
      <h2>Ranking Global de Jugadores</h2>
      <table id="global-leaderboard-table" *ngIf="!isLoading; else loading">
        <thead>
          <tr>
            <th>Puesto</th>
            <th>Jugador</th>
            <th>Rating Elo</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let player of leaderboard; let i = index">
            <td>#{{ i + 1 }}</td>
            <td>{{ player.username }}</td>
            <td>{{ player.eloRating | number:'1.0-0' }}</td>
          </tr>
        </tbody>
      </table>
      <ng-template #loading>Cargando ranking...</ng-template>
    </section>
  `,
  styleUrls: ['./leaderboard-view.css']
})
export class LeaderboardViewComponent implements OnInit {
  leaderboard: any[] = [];
  isLoading = true;

  constructor(private apiService: ApiService) {}

  async ngOnInit() {
    this.leaderboard = await this.apiService.getLeaderboards('global');
    this.isLoading = false;
  }
}
