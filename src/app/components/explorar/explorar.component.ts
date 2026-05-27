import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ServicoService } from '../../services/servico.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Servico } from '../../models/models';

@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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
  filtroLocal: '' | 'NO_LOCAL' | 'DOMICILIO' | 'AMBOS' = '';
  filtroCategoria = '';

  modalAberto = false;
  servicoInteresse: Servico | null = null;

  categorias: string[] = [];

  iconesPorCategoria: Record<string, string> = {
    'cabelo': 'fas fa-cut',
    'barba': 'fas fa-user-alt',
    'estética': 'fas fa-spa',
    'estetica': 'fas fa-spa',
    'massagem': 'fas fa-hands',
    'nail': 'fas fa-hand-sparkles',
    'unha': 'fas fa-hand-sparkles',
    'depilação': 'fas fa-star',
    'depilacao': 'fas fa-star',
    'maquiagem': 'fas fa-magic',
    'sobrancelha': 'fas fa-eye',
    'limpeza': 'fas fa-pump-soap',
    'design': 'fas fa-drafting-compass',
    'consultoria': 'fas fa-briefcase',
    'personal': 'fas fa-dumbbell',
    'nutrição': 'fas fa-apple-alt',
    'nutricao': 'fas fa-apple-alt',
    'terapia': 'fas fa-heartbeat',
    'psicolog': 'fas fa-brain',
    'pet': 'fas fa-paw',
    'fotografia': 'fas fa-camera',
  };

  constructor(
    private servicoService: ServicoService,
    private authService: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregando = true;
    this.servicoService.listar().subscribe({
      next: lista => {
        this.servicos = lista.filter(s => s.statusServico === 'ATIVO' || !s.statusServico);
        this.extrairCategorias();
        this.aplicarFiltros();
        this.carregando = false;
      },
      error: () => { this.carregando = false; }
    });
  }

  extrairCategorias() {
    const nomes = this.servicos.map(s => s.nome?.split(' ')[0] ?? '');
    this.categorias = [...new Set(nomes)].filter(Boolean).slice(0, 12);
  }

  getIcone(servico: Servico): string {
    const nome = (servico.nome ?? '').toLowerCase();
    for (const [chave, icone] of Object.entries(this.iconesPorCategoria)) {
      if (nome.includes(chave)) return icone;
    }
    return 'fas fa-concierge-bell';
  }

  getLocalLabel(local?: string): string {
    switch (local) {
      case 'NO_LOCAL': return 'No estabelecimento';
      case 'DOMICILIO': return 'A domicílio';
      case 'AMBOS': return 'Ambos';
      default: return '';
    }
  }

  getLocalIcone(local?: string): string {
    switch (local) {
      case 'NO_LOCAL': return 'fas fa-store';
      case 'DOMICILIO': return 'fas fa-home';
      case 'AMBOS': return 'fas fa-map-marker-alt';
      default: return 'fas fa-map-marker-alt';
    }
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

    if (this.filtroLocal) {
      lista = lista.filter(s =>
        s.localAtendimento === this.filtroLocal || s.localAtendimento === 'AMBOS'
      );
    }

    if (this.filtroCategoria) {
      const cat = this.filtroCategoria.toLowerCase();
      lista = lista.filter(s => s.nome?.toLowerCase().includes(cat));
    }

    lista = lista.filter(s => (s.valorServico ?? s.valor ?? 0) <= this.filtroValorMax);

    switch (this.filtroOrdem) {
      case 'valor_asc':  lista.sort((a, b) => (a.valorServico ?? a.valor ?? 0) - (b.valorServico ?? b.valor ?? 0)); break;
      case 'valor_desc': lista.sort((a, b) => (b.valorServico ?? b.valor ?? 0) - (a.valorServico ?? a.valor ?? 0)); break;
      case 'duracao':    lista.sort((a, b) => a.duracaoMinutos - b.duracaoMinutos); break;
      default:           lista.sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? '')); break;
    }

    this.servicosFiltrados = lista;
  }

  selecionarCategoria(cat: string) {
    this.filtroCategoria = this.filtroCategoria === cat ? '' : cat;
    this.aplicarFiltros();
  }

  limparFiltros() {
    this.termoBusca = '';
    this.filtroValorMax = this.valorMaximo;
    this.filtroOrdem = 'nome';
    this.filtroLocal = '';
    this.filtroCategoria = '';
    this.aplicarFiltros();
  }

  contratarServico(s: Servico) {
    if (this.authService.estaLogado()) {
      const tipo = this.authService.getTipoUsuario();
      if (tipo === 'CLIENTE') {
        this.router.navigate(['/area-cliente']);
        return;
      }
    }
    this.servicoInteresse = s;
    this.modalAberto = true;
  }

  fecharModal() { this.modalAberto = false; this.servicoInteresse = null; }
  irParaCadastro() { this.router.navigate(['/cadastro-cliente']); }
  irParaLogin() { this.router.navigate(['/login']); }

  get valorMaximo(): number {
    return this.servicos.length > 0
      ? Math.max(...this.servicos.map(s => s.valorServico ?? s.valor ?? 0))
      : 1000;
  }

  get temFiltrosAtivos(): boolean {
    return !!(this.termoBusca || this.filtroLocal || this.filtroCategoria || this.filtroValorMax < this.valorMaximo);
  }
}