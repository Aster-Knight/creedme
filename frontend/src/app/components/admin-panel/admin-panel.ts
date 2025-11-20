import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';
import { GameState } from '../../services/api';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-panel.html',
  styleUrls: ['./admin-panel.css']
})
export class AdminPanelComponent implements OnInit {
  @Input() localGameState: GameState | undefined;

  private apiService = inject(ApiService);

  isProcessing = false;
  processingStatus = '';

  constructor() {}

  ngOnInit(): void {}

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
      // Bucle para procesar cada pregunta
      for (let i = 0; i < 9; i++) {
        this.processingStatus = `Procesando Pregunta ${i + 1}/9...`;
        const url = `/.netlify/functions/processSet?setId=${setId}&questionIndex=${i}`;
        await this.apiService.processSet(url).toPromise();
      }

      // Llamada final para calcular el Elo y crear el nuevo set
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