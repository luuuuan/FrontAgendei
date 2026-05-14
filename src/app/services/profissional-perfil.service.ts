import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Profissional } from '../models/models';

/**
 * Service do próprio profissional — dados e ações relacionadas ao perfil dele.
 * Separado do ProfissionalService que é usado pelo prestador para gerenciar equipe.
 */
@Injectable({ providedIn: 'root' })
export class ProfissionalPerfilService {
  private apiUrl = `${environment.apiUrl}/profissional`;

  constructor(private http: HttpClient) {}

  // Busca o perfil profissional vinculado a um usuário (usado no login do profissional)
  buscarPorUsuarioId(usuarioId: number): Observable<Profissional> {
    return this.http.get<Profissional>(`${this.apiUrl}/usuario/${usuarioId}`);
  }

  // Atualiza dados do próprio perfil profissional
  atualizar(profissionalId: number, dados: Partial<Profissional>): Observable<Profissional> {
    return this.http.patch<Profissional>(`${this.apiUrl}/atualizar/${profissionalId}`, dados);
  }
}
