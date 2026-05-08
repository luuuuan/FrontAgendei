import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { HorarioDisponivel } from '../models/models';

@Injectable({ providedIn: 'root' })
export class HorarioService {
  private apiUrl = `${environment.apiUrl}/horarioDisponivel`;

  constructor(private http: HttpClient) {}

  cadastrar(horario: Partial<HorarioDisponivel>): Observable<HorarioDisponivel> {
    return this.http.post<HorarioDisponivel>(`${this.apiUrl}/cadastrar`, horario);
  }

  listarPorProfissional(profissionalId: number): Observable<HorarioDisponivel[]> {
    return this.http.get<HorarioDisponivel[]>(`${this.apiUrl}/profissional/${profissionalId}`);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
