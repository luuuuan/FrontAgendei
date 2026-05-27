import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PagamentoIntentResponse {
  clientSecret: string;
  agendamentoId: number;
}

export interface PagamentoResponse {
  id: number;
  valor: number;
  status: string;
  metodo: string;
  idTransacaoStripe: string;
  dataPagamento: string;
  dataReembolso?: string;
  agendamentoId: number;
}

export interface PagamentoConfirmarRequest {
  agendamentoId: number;
  paymentIntentId: string;
  valor: number;
  formaPgto: string;
}

@Injectable({ providedIn: 'root' })
export class PagamentoService {
  private apiUrl = `${environment.apiUrl}/pagamento`;

  constructor(private http: HttpClient) {}

  criarIntent(agendamentoId: number, valor: number, metodo: string): Observable<PagamentoIntentResponse> {
    return this.http.post<PagamentoIntentResponse>(`${this.apiUrl}/criar-intent`, {
      agendamentoId,
      valor,
      metodo
    });
  }

  confirmar(dados: PagamentoConfirmarRequest): Observable<PagamentoResponse> {
    return this.http.post<PagamentoResponse>(`${this.apiUrl}/confirmar`, dados);
  }

  reembolsar(agendamentoId: number): Observable<PagamentoResponse> {
    return this.http.post<PagamentoResponse>(`${this.apiUrl}/reembolso/${agendamentoId}`, {});
  }

  baixarComprovante(agendamentoId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/comprovante/${agendamentoId}`, {
      responseType: 'blob'
    });
  }
}