import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

// Definimos una interfaz para el estado del juego para tener un tipado fuerte
export interface GameState {
  setId: string;
  setName: string;
  questions: any[]; // Se podría definir una interfaz 'Question' más adelante
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);

  constructor() { }

  getSetState(userId: string): Observable<GameState> {
    // Las Netlify functions están en /.netlify/functions/
    const url = '/.netlify/functions/getSetState';
    return this.http.post<GameState>(url, { userId });
  }
}