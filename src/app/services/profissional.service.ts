import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Profissional } from '../models/models';
import { AuthService } from './auth.service';

/**
 * Service do prestador para gerenciar sua equipe de profissionais.
 * Vinculação, listagem e cadastro de profissionais da empresa.
 */
@Injectable({ providedIn: 'root' })
export class ProfissionalService {
  private apiUrl = `${environment.apiUrl}/profissional`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  listar(): Observable<Profissional[]> {
    const sessao = this.authService.getSessao();
    const params = new HttpParams().set('prestadorId', sessao?.prestadorId ?? '');
    return this.http.get<Profissional[]>(`${this.apiUrl}/profissionaisCadastrados`, { params });
  }

  // Para uso do cliente — lista todos sem filtrar por prestador
  listarTodos(): Observable<Profissional[]> {
    return this.http.get<Profissional[]>(`${this.apiUrl}/profissionaisCadastrados`);
  }

  listarPorServico(servicoId: number): Observable<Profissional[]> {
    return this.http.get<Profissional[]>(`${this.apiUrl}/profissionalServico/${servicoId}`);
  }

  cadastrar(profissional: any): Observable<Profissional> {
    return this.http.post<Profissional>(`${this.apiUrl}/cadastroProfissional`, profissional);
  }

  vincular(profissionalId: number, prestadorId: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/prestador/vincular`, { profissionalId, prestadorId });
  }
}
