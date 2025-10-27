import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-results-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section id="results-section">
      <h2>Resultados de Sets Anteriores</h2>
      <div id="sets-list" *ngIf="!isLoading; else loading">
        <div *ngIf="results.length === 0">No hay resultados disponibles.</div>
        <div class="set-result-card" *ngFor="let set of results">
          <h3>{{ set.setName }}</h3>
          <ul class="result-list">
            <li *ngFor="let res of set.results">
              <strong>Pregunta #{{ res.questionOrder }}:</strong> Quedaste en el puesto <strong>#{{ res.yourRanking }}</strong>. 
              <br>
              <small>El público secreto era: <em>{{ res.secretAudience }}</em></small>
            </li>
          </ul>
        </div>
      </div>
      <ng-template #loading>Cargando resultados...</ng-template>
    </section>
  `,
  styleUrls: ['./results-view.css']
})
export class ResultsViewComponent implements OnInit {
  results: any[] = [];
  isLoading = true;

  constructor(private apiService: ApiService) {}

  async ngOnInit() {
    this.results = await this.apiService.getResults();
    this.isLoading = false;
  }
}
