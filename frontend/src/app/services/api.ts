import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from './auth';

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
  private authService = inject(AuthService);

  // Helper para crear cabeceras con el token de autenticación
  private createAuthHeaders() {
    return from(this.authService.getToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return new Observable<HttpHeaders>(subscriber => subscriber.next(headers));
      })
    );
  }

  getSetState(userId: string): Observable<GameState> {
    const url = '/.netlify/functions/getSetState';
    return this.http.post<GameState>(url, { userId });
  }

  submitResponse(payload: { userId: string, questionId: string, responseText: string }): Observable<{ geminiFeedback: string }> {
    const url = '/.netlify/functions/submitResponse';
    return this.http.post<{ geminiFeedback: string }>(url, payload);
  }

  getResults(userId: string): Observable<any[]> {
    const url = '/.netlify/functions/getResults';
    return this.http.post<any[]>(url, { userId });
  }

  getLeaderboards(payload: { type: 'global' } | { type: 'question', questionId: string }): Observable<any[]> {
    const url = '/.netlify/functions/getLeaderboards';
    return this.http.post<any[]>(url, payload);
  }

  // --- Métodos de Administrador ---

  getSetDetails(setId: string): Observable<any> {
    return this.createAuthHeaders().pipe(
      switchMap(headers => {
        const url = '/.netlify/functions/getSetDetails';
        return this.http.post<any>(url, { setId }, { headers });
      })
    );
  }

  processSet(url: string): Observable<any> {
    return this.createAuthHeaders().pipe(
      switchMap(headers => {
        return this.http.get(url, { headers, responseType: 'text' });
      })
    );
  }
}
