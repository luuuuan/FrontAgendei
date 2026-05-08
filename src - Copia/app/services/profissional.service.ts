import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Profissional } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ProfissionalService {

  private apiUrl = `${environment.apiUrl}/profissional`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Profissional[]> {
    return this.http.get<Profissional[]>(`${this.apiUrl}/profissionaisCadastrados`);
  }

  cadastrar(profissional: any): Observable<Profissional> {
    return this.http.post<Profissional>(`${this.apiUrl}/cadastroProfissional`, profissional);
  }
}
