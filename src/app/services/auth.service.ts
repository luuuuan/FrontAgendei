import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { UsuarioLoginResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private apiUrl = `${environment.apiUrl}/usuarios`;
  private CHAVE_SESSAO = 'agendei_sessao';

  constructor(private http: HttpClient) {}

  login(email: string, senha: string): Observable<UsuarioLoginResponse> {
    return this.http.post<UsuarioLoginResponse>(`${this.apiUrl}/login`, { email, senha }).pipe(
      tap((resposta) => {
        localStorage.setItem(this.CHAVE_SESSAO, JSON.stringify(resposta));
      })
    );
  }

  logout() {
    localStorage.removeItem(this.CHAVE_SESSAO);
  }

  estaLogado(): boolean {
    return localStorage.getItem(this.CHAVE_SESSAO) !== null;
  }

  getSessao(): UsuarioLoginResponse | null {
    const sessao = localStorage.getItem(this.CHAVE_SESSAO);
    if (!sessao) return null;
    try { return JSON.parse(sessao) as UsuarioLoginResponse; }
    catch { return null; }
  }

  getUsuarioId(): number | null { 
    return this.getSessao()?.usuarioId ?? null;
  }
  getTipoUsuario(): string | null { 
    return this.getSessao()?.tipoUsuario ?? null; 
  }
  getEmail(): string | null { 
    return this.getSessao()?.email ?? null; 
  }
}
