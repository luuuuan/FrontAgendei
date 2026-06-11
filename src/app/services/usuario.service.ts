import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario, UsuarioLogin, UsuarioLoginResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) { }

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/clientes`);
  }

  listarTodos(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/todos`);
  }

  listarClientesPorPrestador(prestadorId?: number): Observable<Usuario[]> {
    const params = prestadorId
      ? new HttpParams().set('prestadorId', prestadorId)
      : new HttpParams();
    return this.http.get<Usuario[]>(`${this.apiUrl}/clientes`, { params });
  }

  buscarPorId(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  cadastrar(usuario: any): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/cadastro`, usuario);
  }

  atualizar(usuarioId: number, dados: Partial<Usuario>): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.apiUrl}/atualizar-cliente/${usuarioId}`, dados);
  }

  trocarSenha(id: number, senhaAtual: string, novaSenha: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/senha`, { senhaAtual, novaSenha });
  }

  recuperarSenha(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/recuperarSenha`, { email }, { responseType: 'text' });
  }

  buscarPorCpfOuEmail(valor: string): Observable<Usuario> {
    const params = valor.includes('@')
      ? new HttpParams().set('email', valor)
      : new HttpParams().set('cpf', valor);
    return this.http.get<Usuario>(`${this.apiUrl}/buscar`, { params });
  }

  solicitarConfirmacaoConta(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/confirmarConta`, { email });
  }

  redefinirSenha(token: string, novaSenha: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/redefinirSenha`, { token, novaSenha });
  }


  atualizarAtivo(id: number, ativo: boolean): Observable<any> {
    return this.http.patch<any>(`${environment.apiUrl}/usuarios/${id}/ativo`, { ativo });
  }
}
