import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, GameState } from '../../services/api';
import { User } from 'firebase/auth';
import { Observable, forkJoin, map } from 'rxjs';
import { EloChangePipe } from '../../pipes/elo-change-pipe';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, EloChangePipe],
  templateUrl: './admin-panel.html',
  styleUrls: ['./admin-panel.css']
})
export class AdminPanelComponent implements OnInit {
  @Input() localGameState: GameState | undefined;
  @Input({ required: true }) user!: User;

  private apiService = inject(ApiService);

  isProcessing = false;
  processingStatus = '';
  closedSetsDetails$: Observable<any[]> | undefined;

  constructor() {}

  ngOnInit(): void {
    // Obtenemos los resultados (que son los sets cerrados)
    this.apiService.getResults(this.user.uid).pipe(
      map(closedSets => {
        // Para cada set cerrado, obtenemos sus detalles completos
        const detailObservables = closedSets.map(set => this.apiService.getSetDetails(set.setId));
        // forkJoin espera a que todas las llamadas a getSetDetails terminen
        return forkJoin(detailObservables);
      })
    ).subscribe(detailsObservable => {
      this.closedSetsDetails$ = detailsObservable;
    });
  }

  async processSet() {
    if (!this.localGameState || !this.localGameState.setId) {
      alert('No se ha cargado un set activo.');
      return;
    }

    if (!confirm(`Vas a iniciar el procesamiento para el set ${this.localGameState.setName}. Este proceso no se puede detener. ¿Continuar?`)) {
      return;
    }

    this.isProcessing = true;
    const setId = this.localGameState.setId;

    try {
      for (let i = 0; i < 9; i++) {
        this.processingStatus = `Procesando Pregunta ${i + 1}/9...`;
        const url = `/.netlify/functions/processSet?setId=${setId}&questionIndex=${i}`;
        await this.apiService.processSet(url).toPromise();
      }

      this.processingStatus = 'Calculando Elo y creando nuevo set...';
      const finalUrl = `/.netlify/functions/processSet?setId=${setId}&step=calculate`;
      await this.apiService.processSet(finalUrl).toPromise();

      alert('¡Set procesado con éxito! La página se recargará.');
      location.reload();

    } catch (error: any) {
      this.processingStatus = `Error: ${error.message}`;
      alert(`Hubo un error al procesar el set: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }
}
