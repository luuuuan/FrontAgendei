import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EnderecoPayload {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export interface EnderecoResponse {
  id: number;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

@Injectable({ providedIn: 'root' })
export class EnderecoService {
  private apiUrl = `${environment.apiUrl}/endereco`;

  constructor(private http: HttpClient) {}

  criar(endereco: EnderecoPayload): Observable<EnderecoResponse> {
    return this.http.post<EnderecoResponse>(`${this.apiUrl}/enderecoUser`, endereco);
  }
}
