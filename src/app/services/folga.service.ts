import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Folga {
  id?: number;
  profissionalId: number;
  data: string;
  diaInteiro: boolean;
  horaInicio?: string;
  horaFim?: string;
  motivo?: string;
}

@Injectable({ providedIn: 'root' })
export class FolgaService {
  private apiUrl = `${environment.apiUrl}/folga`;

  constructor(private http: HttpClient) {}

  cadastrar(folga: Folga): Observable<Folga> {
    return this.http.post<Folga>(`${this.apiUrl}/cadastrar`, folga);
  }

  buscarPorProfissional(profissionalId: number): Observable<Folga[]> {
    return this.http.get<Folga[]>(`${this.apiUrl}/profissional/${profissionalId}`);
  }

  buscarPorPrestador(prestadorId: number): Observable<Folga[]> {
    return this.http.get<Folga[]>(`${this.apiUrl}/prestador/${prestadorId}`);
  }

  excluir(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/desativar/${id}`, { ativo: false });
}
}
