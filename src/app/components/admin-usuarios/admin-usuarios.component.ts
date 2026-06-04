import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../services/usuario.service';
import { ToastService } from '../../services/toast.service';
import { Usuario } from '../../models/models';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-usuarios.component.html',
  styleUrls: ['./admin-usuarios.component.css']
})
export class AdminUsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  carregando = false;
  termoBusca = '';
  filtroTipo = 'TODOS';
  atualizando: number | null = null;
  modalDetalhesAberto = false;
  usuarioDetalhes: Usuario | null = null;

  tipos = ['TODOS', 'CLIENTE', 'PRESTADOR', 'ADMINISTRADOR'];

  constructor(
    private usuarioService: UsuarioService,
    private toast: ToastService
  ) { }

  ngOnInit() { this.carregar(); }

  carregar() {
    this.carregando = true;
    this.usuarioService.listarTodos().subscribe({
      next: (l: Usuario[]) => { this.usuarios = l; this.filtrar(); this.carregando = false; },
      error: () => { this.carregando = false; }
    });
  }

  filtrar() {
    let lista = this.usuarios;
    if (this.filtroTipo !== 'TODOS') lista = lista.filter(u => u.tipoUsuario === this.filtroTipo);
    const t = this.termoBusca.toLowerCase().trim();
    if (t) lista = lista.filter(u => u.nome?.toLowerCase().includes(t) || u.email?.toLowerCase().includes(t));
    this.usuariosFiltrados = lista;
  }

  bloquear(u: Usuario) {
    if (!confirm(`Deseja ${u.ativo ? 'bloquear' : 'desbloquear'} ${u.nome}?`)) return;
    this.atualizando = u.id!;
    this.usuarioService.atualizarAtivo(u.id!, !u.ativo).subscribe({
      next: () => {
        u.ativo = !u.ativo;
        this.toast.sucesso(u.ativo ? 'Usuário desbloqueado.' : 'Usuário bloqueado.');
        this.atualizando = null;
      },
      error: (err: any) => { this.toast.erro(err.mensagemAmigavel || 'Erro.'); this.atualizando = null; }
    });
  }

  verDetalhes(u: Usuario) { this.usuarioDetalhes = u; this.modalDetalhesAberto = true; }
  fecharDetalhes() { this.modalDetalhesAberto = false; this.usuarioDetalhes = null; }

  iniciais(nome: string | undefined): string {
    if (!nome) return '?';
    const p = nome.trim().split(' ');
    return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
  }

  classeStatus(ativo: boolean | undefined) { return ativo ? 'badge-success' : 'badge-danger'; }
  classeTipo(tipo: string | undefined) {
    return ({ ADMIN: 'badge-warning', PRESTADOR: 'badge-info', CLIENTE: 'badge-success' } as any)[tipo || ''] || 'badge-gray';
  }
}
