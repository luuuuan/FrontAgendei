import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServicoService } from '../../services/servico.service';
import { ProfissionalService } from '../../services/profissional.service';
import { UsuarioService } from '../../services/usuario.service';
import { AgendamentoService } from '../../services/agendamento.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { Servico, Profissional, AgendamentoResponse } from '../../models/models';

interface ItemRanking { nome: string; quantidade: number; percentual: number; valor?: number; }

type TipoRelatorio = 'agendamentos' | 'financeiro' | 'servicos' | 'clientes';

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './relatorios.component.html',
  styleUrls: ['./relatorios.component.css']
})
export class RelatoriosComponent implements OnInit {
  servicos: Servico[] = [];
  profissionais: Profissional[] = [];
  agendamentos: AgendamentoResponse[] = [];
  agendamentosFiltrados: AgendamentoResponse[] = [];

  totalUsuarios = 0;
  totalServicos = 0;
  totalProfissionais = 0;
  totalAgendamentos = 0;
  totalReceita = 0;
  totalConfirmados = 0;
  totalPendentes = 0;
  totalCancelados = 0;

  servicosRanking: ItemRanking[] = [];
  profissionaisRanking: ItemRanking[] = [];

  carregando = true;
  tipoRelatorio: TipoRelatorio = 'agendamentos';

  // Filtros de período
  dataInicio = '';
  dataFim = '';
  dataMaxima = new Date().toISOString().split('T')[0];

  constructor(
    private servicoService: ServicoService,
    private profissionalService: ProfissionalService,
    private usuarioService: UsuarioService,
    private agendamentoService: AgendamentoService,
    private toast: ToastService,
    private authService: AuthService
  ) {
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    this.dataInicio = primeiroDia.toISOString().split('T')[0];
    this.dataFim = hoje.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.servicoService.listar().subscribe({
      next: l => { this.servicos = l; this.totalServicos = l.length; this.calcularRankings(); },
      error: () => { }
    });
    this.profissionalService.listar().subscribe({
      next: l => { this.profissionais = l; this.totalProfissionais = l.length; this.calcularRankings(); },
      error: () => { }
    });
    this.usuarioService.listar().subscribe({
      next: l => { this.totalUsuarios = l.length; },
      error: () => { }
    });
    this.carregarAgendamentos();
  }

  carregarAgendamentos() {
    this.carregando = true;
    const sessao = this.authService.getSessao();
    this.agendamentoService.buscarPorPrestador(sessao?.prestadorId || 0).subscribe({
      next: l => { this.agendamentos = l; this.aplicarFiltros(); this.carregando = false; },
      error: () => {
        this.agendamentoService.buscarPorData(this.dataInicio).subscribe({
          next: l => { this.agendamentos = l; this.aplicarFiltros(); this.carregando = false; },
          error: () => { this.carregando = false; }
        });
      }
    });
  }

  aplicarFiltros() {
    this.agendamentosFiltrados = this.agendamentos.filter(ag => {
      const data = ag.dataAgendamento?.split('T')[0] || '';
      const dentroInicio = !this.dataInicio || data >= this.dataInicio;
      const dentroFim = !this.dataFim || data <= this.dataFim;
      return dentroInicio && dentroFim;
    });
    this.calcularTotais();
    this.calcularRankings();
  }

  calcularTotais() {
    const ags = this.agendamentosFiltrados;
    this.totalAgendamentos = ags.length;
    this.totalConfirmados = ags.filter(a => a.statusAgendamento === 'CONFIRMADO' || a.statusAgendamento === 'REALIZADO').length;
    this.totalPendentes = ags.filter(a => a.statusAgendamento === 'PENDENTE').length;
    this.totalCancelados = ags.filter(a => a.statusAgendamento === 'CANCELADO').length;
    this.totalReceita = ags.filter(a => a.statusAgendamento !== 'CANCELADO').reduce((s, a) => s + (a.valorTotal || 0), 0);
  }

  calcularRankings() {
    const ags = this.agendamentosFiltrados.length > 0 ? this.agendamentosFiltrados : this.agendamentos;

    if (this.servicos.length > 0) {
      const cnt: any = {}; const val: any = {};
      ags.forEach(ag => ag.servicoId?.forEach(sid => {
        cnt[sid] = (cnt[sid] || 0) + 1;
        const sv = this.servicos.find(s => s.id === sid);
        val[sid] = (val[sid] || 0) + (sv?.valor || 0);
      }));
      this.servicosRanking = this.servicos
        .map(s => ({ nome: s.nome, quantidade: cnt[s.id!] || 0, percentual: 0, valor: val[s.id!] || 0 }))
        .sort((a, b) => b.quantidade - a.quantidade).slice(0, 8);
      const max = this.servicosRanking[0]?.quantidade || 1;
      this.servicosRanking.forEach(s => s.percentual = Math.round((s.quantidade / max) * 100));
    }

    if (this.profissionais.length > 0) {
      const cnt: any = {};
      ags.forEach(ag => { cnt[ag.profissionalId] = (cnt[ag.profissionalId] || 0) + 1; });
      this.profissionaisRanking = this.profissionais
        .map(p => ({ nome: p.nome || 'Profissional #' + p.id, quantidade: cnt[p.id!] || 0, percentual: 0 }))
        .sort((a, b) => b.quantidade - a.quantidade).slice(0, 8);
      const max = this.profissionaisRanking[0]?.quantidade || 1;
      this.profissionaisRanking.forEach(p => p.percentual = Math.round((p.quantidade / max) * 100));
    }
  }

  // Agrupamento por data para relatório de agendamentos
  get agendamentosPorDia(): { data: string; quantidade: number; receita: number }[] {
    const map: any = {};
    this.agendamentosFiltrados.forEach(ag => {
      const d = ag.dataAgendamento?.split('T')[0] || 'Sem data';
      if (!map[d]) map[d] = { data: d, quantidade: 0, receita: 0 };
      map[d].quantidade++;
      if (ag.statusAgendamento !== 'CANCELADO') map[d].receita += ag.valorTotal || 0;
    });
    return (Object.values(map) as { data: string; quantidade: number; receita: number }[])
      .sort((a, b) => a.data.localeCompare(b.data));
  }

  get taxaCancelamento(): number {
    if (!this.totalAgendamentos) return 0;
    return Math.round((this.totalCancelados / this.totalAgendamentos) * 100);
  }

  get ticketMedio(): number {
    const realizados = this.agendamentosFiltrados.filter(a => a.statusAgendamento !== 'CANCELADO').length;
    return realizados ? this.totalReceita / realizados : 0;
  }

  exportarCSV() {
    let csv = 'Data,Profissional,Servico,Status,Valor\n';
    this.agendamentosFiltrados.forEach(ag => {
      const data = ag.dataAgendamento?.split('T')[0] || '';
      const prof = this.nomeProfissional(ag.profissionalId);
      const servs = (ag.servicoId || []).map(s => this.nomeServico(s)).join('; ');
      const valor = (ag.valorTotal || 0).toFixed(2);
      csv += `${data},"${prof}","${servs}",${ag.statusAgendamento},${valor}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'relatorio_agendamentos.csv';
    link.click();
    URL.revokeObjectURL(url);
    this.toast.sucesso('Relatorio exportado com sucesso!');
  }

  corBarra(i: number) { return ['#4361ee', '#4cc9f0', '#2ec4b6', '#ff9f1c', '#f72585'][i % 5]; }
  nomeProfissional(id: number) { return this.profissionais.find(p => p.id === id)?.nome || 'Profissional #' + id; }
  nomeServico(id: number) { return this.servicos.find(s => s.id === id)?.nome || 'Servico #' + id; }
  formatarData(v: string) {
    if (!v) return '-';
    const d = v.includes('T') ? new Date(v) : new Date(v + 'T00:00:00');
    return d.toLocaleDateString('pt-BR');
  }
}
