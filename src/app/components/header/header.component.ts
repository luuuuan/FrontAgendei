import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  nomeUsuario = '';
  tipoUsuario = '';
  iniciais = 'AG';
  menuPerfilAberto = false;

  constructor(
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregarDadosUsuario();
  }

  carregarDadosUsuario() {
    const sessao = this.authService.getSessao();
    if (!sessao) return;
    this.tipoUsuario = sessao.tipoUsuario || '';
    this.usuarioService.listar().subscribe({
      next: (lista) => {
        const usuario = lista.find(u => u.email === sessao.email);
        if (usuario) {
          this.nomeUsuario = usuario.nome;
          this.iniciais = this.gerarIniciais(usuario.nome);
        } else {
          this.nomeUsuario = sessao.email || 'Usuário';
        }
      },
      error: () => { this.nomeUsuario = sessao.email || 'Usuário'; }
    });
  }

  gerarIniciais(nome: string): string {
    if (!nome) return 'AG';
    const partes = nome.trim().split(' ');
    if (partes.length === 1) return partes[0][0].toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  toggleMenuPerfil() { this.menuPerfilAberto = !this.menuPerfilAberto; }
  fecharMenuPerfil() { this.menuPerfilAberto = false; }

  sair() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
