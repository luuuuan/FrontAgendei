import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DadosBancarios {
  id?: number;
  bancoId: number;
  agencia: string;
  conta: string;
  digitoConta?: string;
  tipoConta: string;
  cpfTitular: string;
  nomeTitular: string;
  prestadorId: number;
}

@Injectable({ providedIn: 'root' })
export class DadosBancariosService {
  private apiUrl = `${environment.apiUrl}/dadosBancarios`;

  constructor(private http: HttpClient) {}

  buscarPorPrestador(prestadorId: number): Observable<DadosBancarios> {
    return this.http.get<DadosBancarios>(`${this.apiUrl}/prestador/${prestadorId}`);
  }

  cadastrar(dados: DadosBancarios): Observable<DadosBancarios> {
    return this.http.post<DadosBancarios>(`${this.apiUrl}/cadastrar`, dados);
  }

  atualizar(id: number, dados: DadosBancarios): Observable<DadosBancarios> {
    return this.http.patch<DadosBancarios>(`${this.apiUrl}/atualizar/${id}`, dados);
  }
}
