import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AvaliacaoPayload {
  nota: number;
  comentario?: string;
  agendamentoId?: number;
  profissionalId?: number;
  usuarioId?: number;
}

@Injectable({ providedIn: 'root' })
export class AvaliacaoService {
  private apiUrl = `${environment.apiUrl}/avaliacao`;

  constructor(private http: HttpClient) {}

  cadastrar(payload: AvaliacaoPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}/cadastrar`, payload);
  }

  listarPorProfissional(profissionalId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/profissional/${profissionalId}`);
  }
}