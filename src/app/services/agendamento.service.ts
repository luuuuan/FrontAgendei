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

  buscarPorData(dataAgendamento: string): Observable<AgendamentoResponse[]> {
    return this.http.get<AgendamentoResponse[]>(`${this.apiUrl}/consultaAgendamento`, {
      params: { dataAgendamento }
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

  buscarHorariosDisponiveis(data: string, servicoId?: number, profissionalId?: number, prestadorId?: number): Observable<string[]> {
    let params = new HttpParams()
    .set('dataAgendamento', data)
    if (servicoId) params = params.set('servicoId', servicoId);
    if (profissionalId) params = params.set('profissionalId', profissionalId);
    if (prestadorId) params = params.set('prestadorId', prestadorId);
    
    return this.http.get<string[]>(`${this.apiUrl}/disponibilidade`, { params });
  }

  atualizarStatus(id: number, status: string): Observable<AgendamentoResponse> {
    return this.http.patch<AgendamentoResponse>(`${this.apiUrl}/atualizar-status/${id}`, { status });
  }


  buscarPorPrestador(prestadorId: number): Observable<AgendamentoResponse[]> {
    return this.http.get<AgendamentoResponse[]>(`${this.apiUrl}/todos`, {
      params: { prestadorId }
    });
  }
}
