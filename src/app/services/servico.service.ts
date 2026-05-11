import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Servico } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ServicoService {
  private apiUrl = `${environment.apiUrl}/servico`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Servico[]> {
    return this.http.get<Servico[]>(`${this.apiUrl}/servicos`);
  }

  listarPorPrestador(prestadorId?: number): Observable<Servico[]> {
    const params = prestadorId
      ? new HttpParams().set('prestadorId', prestadorId)
      : new HttpParams();
    return this.http.get<Servico[]>(`${this.apiUrl}/servicos`, { params });
  }

  listarPorProfissional(profissionalId: number): Observable<Servico[]> {
    return this.http.get<Servico[]>(`${this.apiUrl}/servicosProfissional/${profissionalId}`);
  }

  cadastrar(servico: any): Observable<Servico> {
    return this.http.post<Servico>(`${this.apiUrl}/cadastroServicos`, servico);
  }

  // Fix 2: método de atualização de serviço
  atualizar(id: number, servico: any): Observable<Servico> {
    return this.http.patch<Servico>(`${this.apiUrl}/atualizar/${id}`, servico);
  }
}
