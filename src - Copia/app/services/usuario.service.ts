import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario, UsuarioLogin, UsuarioLoginResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/clientes`);
  }

  buscarPorId(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  cadastrar(usuario: any): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/cadastro`, usuario);
  }

  // Atualiza dados do usuário (requer endpoint PUT /usuarios/{id} no backend)
  atualizar(id: number, dados: Partial<Usuario>): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}`, dados);
  }

  // Troca senha (requer endpoint PATCH /usuarios/{id}/senha no backend)
  trocarSenha(id: number, senhaAtual: string, novaSenha: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/senha`, { senhaAtual, novaSenha });
  }

  // Recuperação de senha por email (requer endpoint POST /usuarios/recuperar-senha no backend)
  recuperarSenha(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/recuperarSenha`, { email });
  }

  login(dados: UsuarioLogin): Observable<UsuarioLoginResponse> {
    return this.http.post<UsuarioLoginResponse>(`${this.apiUrl}/login`, dados);
  }

  // Busca usuário por CPF/email (requer endpoint GET /usuarios/buscar?cpf= ou ?email= no backend)
  buscarPorCpfOuEmail(valor: string): Observable<Usuario> {
    const params = valor.includes('@')
      ? new HttpParams().set('email', valor)
      : new HttpParams().set('cpf', valor);
    return this.http.get<Usuario>(`${this.apiUrl}/buscar`, { params });
  }

  // Redefine senha via token (requer POST /usuarios/redefinir-senha no backend)
  redefinirSenha(token: string, novaSenha: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/redefinirSenha`, { token, novaSenha });
  }

}