import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ServicoService } from '../../services/servico.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Servico } from '../../models/models';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule
    
  ],
  templateUrl: './explorar.component.html',
  styleUrls: ['./explorar.component.css']
})
export class ExplorarComponent implements OnInit {
  servicos: Servico[] = [];
  servicosFiltrados: Servico[] = [];
  carregando = false;

  termoBusca = '';
  filtroValorMax = 1000;
  filtroOrdem: 'nome' | 'valor_asc' | 'valor_desc' | 'duracao' = 'nome';

  modalCadastroAberto = false;
  servicoInteresse: Servico | null = null;

  constructor(
    private servicoService: ServicoService,
    private authService: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregando = true;
    this.servicoService.listar().subscribe({
      next: l => {
        this.servicos = l.filter(s => s.statusServico === 'ATIVO' || !s.statusServico);
        this.aplicarFiltros();
        this.carregando = false;
      },
      error: () => { this.carregando = false; }
    });
  }

  aplicarFiltros() {
    let lista = [...this.servicos];

    if (this.termoBusca.trim()) {
      const t = this.termoBusca.toLowerCase();
      lista = lista.filter(s =>
        s.nome?.toLowerCase().includes(t) ||
        s.descricao?.toLowerCase().includes(t)
      );
    }

    lista = lista.filter(s => (s.valorServico ?? s.valor) <= this.filtroValorMax);
 
    switch (this.filtroOrdem) {
      case 'valor_asc':  lista.sort((a, b) => (a.valorServico ?? a.valor) - (b.valorServico ?? b.valor)); break;
      case 'valor_desc': lista.sort((a, b) => (b.valorServico ?? b.valor) - (a.valorServico ?? a.valor)); break;
      case 'duracao':    lista.sort((a, b) => a.duracaoMinutos - b.duracaoMinutos); break;
      default:           lista.sort((a, b) => a.nome.localeCompare(b.nome)); break;
    }

    this.servicosFiltrados = lista;
  }

  contratarServico(s: Servico) {
    // Se já está logado como cliente, vai direto para área do cliente
    if (this.authService.estaLogado()) {
      const tipo = this.authService.getTipoUsuario();
      if (tipo === 'CLIENTE') {
        this.router.navigate(['/area-cliente']);
        return;
      }
    }
    // Não logado — abre modal pedindo cadastro
    this.servicoInteresse = s;
    this.modalCadastroAberto = true;
  }

  fecharModal() { this.modalCadastroAberto = false; this.servicoInteresse = null; }

  irParaCadastro() { this.router.navigate(['/cadastro-cliente']); }
  irParaLogin() { this.router.navigate(['/login']); }

  get valorMaximo(): number {
    return this.servicos.length > 0 ? Math.max(...this.servicos.map(s => s.valorServico ?? s.valor)) : 1000;
  }
}
