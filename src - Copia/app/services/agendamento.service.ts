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

  // Busca todos os agendamentos (requer endpoint GET /agendamento/todos no backend)
  buscarTodos(): Observable<AgendamentoResponse[]> {
    return this.http.get<AgendamentoResponse[]>(`${this.apiUrl}/todos`);
  }

  // Busca agendamentos por usuário (requer endpoint GET /agendamento/usuario/{id} no backend)
  buscarPorUsuario(usuarioId: number): Observable<AgendamentoResponse[]> {
    return this.http.get<AgendamentoResponse[]>(`${this.apiUrl}/usuario/${usuarioId}`);
  }

  // Busca por intervalo de datas (requer endpoint GET /agendamento/periodo no backend)
  buscarPorPeriodo(dataInicio: string, dataFim: string): Observable<AgendamentoResponse[]> {
    return this.http.get<AgendamentoResponse[]>(`${this.apiUrl}/periodo`, {
      params: { dataInicio, dataFim }
    });
  }

  buscarHorariosDisponiveis(profissionalId: number, dataAgendamento: string): Observable<string[]> {
  return this.http.get<string[]>(`${this.apiUrl}/disponibilidade`, {
    params: new HttpParams()
      .set('profissionalId', profissionalId)
      .set('dataAgendamento', dataAgendamento)
  });
}
}
