import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Servico } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ServicoService {

  private apiUrl = `${environment.apiUrl}/servico`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Servico[]> {
    return this.http.get<Servico[]>(`${this.apiUrl}/servicos`);
  }

  listarPorProfissional(profissionalId: number): Observable<Servico[]> {
    return this.http.get<Servico[]>(`${this.apiUrl}/servicosProfissional/${profissionalId}`);
  }

  cadastrar(servico: Servico): Observable<Servico> {
    return this.http.post<Servico>(`${this.apiUrl}/cadastroServicos`, servico);
  }
}
