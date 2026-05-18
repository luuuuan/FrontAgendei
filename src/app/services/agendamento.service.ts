import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Agendamento, AgendamentoResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AgendamentoService {
  private apiUrl = `${environment.apiUrl}/agendamento`;

  constructor(private http: HttpClient) {}

  criar(agendamento: Agendamento): Observable<AgendamentoResponse> {
    return this.http.post<AgendamentoResponse>(`${this.apiUrl}/criarAgendamento`, agendamento);
  }

  buscarPorData(dataCriacao: string): Observable<AgendamentoResponse[]> {
    return this.http.get<AgendamentoResponse[]>(`${this.apiUrl}/consultaAgendamento`, {
      params: { dataCriacao }
    });
  }

  buscarTodos(): Observable<AgendamentoResponse[]> {
    return this.http.get<AgendamentoResponse[]>(`${this.apiUrl}/todos`);
  }

  buscarPorUsuario(usuarioId: number): Observable<AgendamentoResponse[]> {
    return this.http.get<AgendamentoResponse[]>(`${this.apiUrl}/usuario/${usuarioId}`);
  }

  buscarPorPeriodo(dataInicio: string, dataFim: string): Observable<AgendamentoResponse[]> {
    return this.http.get<AgendamentoResponse[]>(`${this.apiUrl}/periodo`, {
      params: { dataInicio, dataFim }
    });
  }

  buscarHorariosDisponiveis(profissionalId: number, data: string, servicoId?: number): Observable<string[]> {
    let params = new HttpParams()
      .set('profissionalId', profissionalId)
      .set('dataAgendamento', data);
    if (servicoId) params = params.set('servicoId', servicoId);
    return this.http.get<string[]>(`${this.apiUrl}/disponibilidade`, { params });
  }

  atualizarStatus(id: number, status: string): Observable<AgendamentoResponse> {
    return this.http.patch<AgendamentoResponse>(`${this.apiUrl}/atualizar-status/${id}`, { status });
  }

  avaliar(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/avaliacao`, payload);
  }

  buscarPorPrestador(prestadorId: number): Observable<AgendamentoResponse[]> {
    return this.http.get<AgendamentoResponse[]>(`${this.apiUrl}/todos`, {
      params: { prestadorId }
    });
  }
}
