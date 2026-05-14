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

    this.usuarioService.buscarPorId(sessao.usuarioId).subscribe({
      next: (usuario) => {
        // Se for prestador e tiver nomeFantasia no usuario
        const nome = (usuario as any).nomeFantasia || (usuario as any).razaoSocial || usuario.nome;
        this.nomeUsuario = nome;
        this.iniciais = this.gerarIniciais(nome);
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
