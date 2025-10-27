import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

export interface GameState { setId: string; setName: string; questions: any[]; }

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly functionsUrl = '/.netlify/functions';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private async getAuthHeaders(): Promise<HttpHeaders> {
    const user = await firstValueFrom(this.authService.authState$);
    if (!user) return new HttpHeaders();
    const token = await user.getIdToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  async getGameState(): Promise<GameState> {
    const headers = await this.getAuthHeaders();
    const user = await firstValueFrom(this.authService.authState$);
    const body = { userId: user?.uid };
    return firstValueFrom(this.http.post<GameState>(`${this.functionsUrl}/getSetState`, body, { headers }));
  }

  async submitResponse(questionId: string, responseText: string): Promise<{ geminiFeedback: string }> {
    const headers = await this.getAuthHeaders();
    const user = await firstValueFrom(this.authService.authState$);
    const body = { userId: user?.uid, questionId, responseText };
    return firstValueFrom(this.http.post<{ geminiFeedback: string }>(`${this.functionsUrl}/submitResponse`, body, { headers }));
  }

  async getResults(): Promise<any[]> {
    const headers = await this.getAuthHeaders();
    const user = await firstValueFrom(this.authService.authState$);
    const body = { userId: user?.uid };
    return firstValueFrom(this.http.post<any[]>(`${this.functionsUrl}/getResults`, body, { headers }));
  }

  async getLeaderboards(type: 'global' | 'question', questionId?: string): Promise<any[]> {
    const body = { type, questionId };
    return firstValueFrom(this.http.post<any[]>(`${this.functionsUrl}/getLeaderboards`, body));
  }

  async processSet(setId: string, step: string, questionIndex?: number): Promise<any> {
    const headers = await this.getAuthHeaders();
    let url = `${this.functionsUrl}/processSet?setId=${setId}`;
    if (step) url += `&step=${step}`;
    if (questionIndex !== undefined) url += `&questionIndex=${questionIndex}`;
    return firstValueFrom(this.http.get(url, { headers }));
  }

  async getSetDetails(setId: string): Promise<any> {
    const headers = await this.getAuthHeaders();
    const body = { setId };
    return firstValueFrom(this.http.post<any>(`${this.functionsUrl}/getSetDetails`, body, { headers }));
  }
}
