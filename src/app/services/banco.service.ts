import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Banco {
  id?: number;
  codigo: string;
  nome: string;
}

@Injectable({ providedIn: 'root' })
export class BancoService {
  private apiUrl = `${environment.apiUrl}/banco`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Banco[]> {
    return this.http.get<Banco[]>(`${this.apiUrl}/listar`);
  }
}
