import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { EloChangePipe } from '../../pipes/elo-change-pipe';

// Interfaz para tipar los datos de usuario que vienen de la API
interface UserDetails {
  id: string;
  username: string;
  eloRating: number;
}

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, EloChangePipe],
  templateUrl: './admin-panel.html',
  styleUrls: ['./admin-panel.css']
})
export class AdminPanelComponent implements OnInit {
  activeSetId: string | null = null;
  activeSetName: string | null = null;
  closedSets: any[] = [];
  setDetails: Map<string, any> = new Map();
  processingStatus = '';
  isProcessing = false;

  constructor(private apiService: ApiService) {}

  async ngOnInit() {
    const gameState = await this.apiService.getGameState();
    this.activeSetId = gameState.setId;
    this.activeSetName = gameState.setName;

    this.closedSets = await this.apiService.getResults();
    for (const set of this.closedSets) {
      this.loadSetDetails(set.setId);
    }
  }

  async processActiveSet() {
    if (!this.activeSetId || !confirm(`Vas a iniciar el procesamiento para el set ${this.activeSetName}. ¿Continuar?`)) return;

    this.isProcessing = true;
    try {
      for (let i = 0; i < 9; i++) {
        this.processingStatus = `Procesando Pregunta ${i + 1}/9...`;
        await this.apiService.processSet(this.activeSetId, 'rank', i);
      }

      this.processingStatus = 'Calculando Elo y creando nuevo set...';
      await this.apiService.processSet(this.activeSetId, 'calculate');

      alert('¡Set procesado con éxito! La página se recargará.');
      location.reload();

    } catch (error) {
      alert(`Hubo un error al procesar el set: ${error}`);
      this.isProcessing = false;
      this.processingStatus = '';
    }
  }

  async loadSetDetails(setId: string) {
    try {
      const details = await this.apiService.getSetDetails(setId);
      const processedDetails = this.processEloEvolution(details);
      this.setDetails.set(setId, processedDetails);
    } catch (error) {
      console.error(`Error cargando detalles para el set ${setId}:`, error);
    }
  }

  // Esta es la función más compleja. Su propósito es simular la evolución del Elo
  // de todos los jugadores a lo largo de un set de preguntas para poder mostrarlo en una tabla.
  // La lógica fue refactorizada para "ayudar" al compilador de TypeScript, que tenía problemas
  // para analizar el flujo de control en una versión anterior con bucles anidados.
  processEloEvolution(details: any) { 
    const { questions, responses } = details;
    const users: UserDetails[] = details.users;

    // PASO 1: Crear Mapas para un acceso a datos O(1) - mucho más rápido y fácil de analizar para TS que usar .find() dentro de un bucle.
    const usersMap = new Map<string, UserDetails>(users.map(u => [u.id, u]));
    const userSimulatedElos = new Map<string, number>(users.map(u => [u.id, u.eloRating]));
    const userEvolution = new Map<string, number[]>(users.map(u => [u.id, [u.eloRating]]));
    const userNames = new Map<string, string>(users.map(u => [u.id, u.username]));

    // PASO 2: Iterar sobre cada pregunta del set.
    for (const question of questions) {
        const rankedResponses = responses
            .filter((r: any) => r.questionId === question.id && r.ranking != null)
            .sort((a: any, b: any) => a.ranking! - b.ranking!);

        const N = rankedResponses.length;
        const roundEloChanges = new Map<string, number>();

        if (N > 0) {
            const k = 100 / (N > 1 ? N : 2); // Factor K del Elo, ajustado por el número de participantes.
            if (N === 1) {
                // Caso especial: un solo jugador respondió. Gana puntos por defecto.
                roundEloChanges.set(rankedResponses[0].userId, k);
            } else {
                // PASO 3: Iterar sobre los enfrentamientos directos (1 vs 2, 2 vs 3, etc.)
                for (let i = 0; i < N - 1; i++) {
                    const pA_response = rankedResponses[i];
                    const pB_response = rankedResponses[i+1];

                    // Type Guard explícito. TS entiende que después de este `continue`, pA_user y pB_user no son undefined.
                    const pA_user = usersMap.get(pA_response.userId);
                    const pB_user = usersMap.get(pB_response.userId);
                    if (!pA_user || !pB_user) continue;

                    // Obtenemos el Elo simulado actual de la ronda.
                    const pA_elo = userSimulatedElos.get(pA_user.id)!;
                    const pB_elo = userSimulatedElos.get(pB_user.id)!;

                    // Fórmula estándar de Elo para el puntaje esperado.
                    const eA = 1 / (1 + Math.pow(10, (pB_elo - pA_elo) / 400));
                    const changeA = k * (1 - eA); // Cambio para el ganador (Player A)
                    const changeB = k * (0 - (1 - eA)); // Cambio para el perdedor (Player B)

                    // Acumulamos los cambios de la ronda.
                    roundEloChanges.set(pA_user.id, (roundEloChanges.get(pA_user.id) || 0) + changeA);
                    roundEloChanges.set(pB_user.id, (roundEloChanges.get(pB_user.id) || 0) + changeB);
                }
            }
        }

        // PASO 4: Aplicar los cambios de la ronda a la simulación y registrar la evolución.
        users.forEach(u => {
            const change = roundEloChanges.get(u.id) || 0;
            const currentElo = userSimulatedElos.get(u.id)!;
            const newElo = currentElo + change;
            userSimulatedElos.set(u.id, newElo);
            userEvolution.get(u.id)!.push(newElo);
        });
    }
    
    // Devolvemos los datos procesados para que la plantilla los renderice.
    return { users, questions, userEvolution, userNames };
  }

  getPlayerColor(userId: string) {
    const colors = ['#e6194B', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#42d4f4', '#f032e6', '#bfef45', '#fabed4'];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash % colors.length)];
  }
}