import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface GradeTrabalho {
  id?: number;
  profissionalId: number;
  diasSemana: string; 
  horaInicio: string;
  horaFim: string;
  inicioIntervalo?: string;
  fimIntervalo?: string;
  ativo: boolean;
}

@Injectable({ providedIn: 'root' })
export class GradeTrabalhoService {
  private apiUrl = `${environment.apiUrl}/gradeTrabalho`;

  constructor(private http: HttpClient) {}

  cadastrar(grade: GradeTrabalho): Observable<GradeTrabalho> {
    return this.http.post<GradeTrabalho>(`${this.apiUrl}/cadastrar`, grade);
  }

  buscarPorProfissional(profissionalId: number): Observable<GradeTrabalho[]> {
    return this.http.get<GradeTrabalho[]>(`${this.apiUrl}/profissional/${profissionalId}`);
  }

  atualizar(id: number, grade: GradeTrabalho): Observable<GradeTrabalho> {
    return this.http.put<GradeTrabalho>(`${this.apiUrl}/atualizar/${id}`, grade);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/excluir/${id}`);
  }
}
