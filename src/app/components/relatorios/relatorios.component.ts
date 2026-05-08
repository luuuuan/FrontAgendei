import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServicoService } from '../../services/servico.service';
import { ProfissionalService } from '../../services/profissional.service';
import { UsuarioService } from '../../services/usuario.service';
import { AgendamentoService } from '../../services/agendamento.service';
import { Servico, Profissional, AgendamentoResponse } from '../../models/models';

interface ItemRanking { nome: string; quantidade: number; percentual: number; }

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './relatorios.component.html',
  styleUrls: ['./relatorios.component.css']
})
export class RelatoriosComponent implements OnInit {
  servicos: Servico[] = []; profissionais: Profissional[] = []; agendamentos: AgendamentoResponse[] = [];
  servicosRanking: ItemRanking[] = []; profissionaisRanking: ItemRanking[] = [];
  totalUsuarios = 0; totalServicos = 0; totalProfissionais = 0; totalAgendamentos = 0;
  carregando = true; abaAtiva: 'servicos' | 'profissionais' = 'servicos';

  constructor(private servicoService: ServicoService, private profissionalService: ProfissionalService, private usuarioService: UsuarioService, private agendamentoService: AgendamentoService) {}

  ngOnInit() {
    this.servicoService.listar().subscribe({ next: l => { this.servicos = l; this.totalServicos = l.length; this.calcularRankings(); }, error: () => this.carregando = false });
    this.profissionalService.listar().subscribe({ next: l => { this.profissionais = l; this.totalProfissionais = l.length; this.calcularRankings(); }, error: () => {} });
    this.usuarioService.listar().subscribe({ next: l => { this.totalUsuarios = l.length; this.carregando = false; }, error: () => this.carregando = false });
    // Busca todos os agendamentos para relatório completo
    this.agendamentoService.buscarTodos().subscribe({
      next: l => { this.agendamentos = l; this.totalAgendamentos = l.length; this.calcularRankings(); },
      error: () => {
        // Fallback: busca agendamentos do dia se o endpoint /todos não existir ainda
        this.agendamentoService.buscarPorData(new Date().toISOString().split('T')[0]).subscribe({
          next: l => { this.agendamentos = l; this.totalAgendamentos = l.length; this.calcularRankings(); },
          error: () => {}
        });
      }
    });
  }

  calcularRankings() {
    if (this.servicos.length > 0) {
      const cnt: any = {};
      this.agendamentos.forEach(ag => ag.servicoId?.forEach(sid => cnt[sid] = (cnt[sid] || 0) + 1));
      this.servicosRanking = this.servicos.map(s => ({ nome: s.nome, quantidade: cnt[s.id!] || 0, percentual: 0 })).sort((a,b) => b.quantidade - a.quantidade).slice(0,5);
      const max = this.servicosRanking[0]?.quantidade || 1;
      this.servicosRanking.forEach(s => s.percentual = Math.round((s.quantidade / max) * 100));
    }
    if (this.profissionais.length > 0) {
      const cnt: any = {};
      this.agendamentos.forEach(ag => { cnt[ag.profissionalId] = (cnt[ag.profissionalId] || 0) + 1; });
      this.profissionaisRanking = this.profissionais.map(p => ({ nome: p.nome || `#${p.id}`, quantidade: cnt[p.id!] || 0, percentual: 0 })).sort((a,b) => b.quantidade - a.quantidade).slice(0,5);
      const max = this.profissionaisRanking[0]?.quantidade || 1;
      this.profissionaisRanking.forEach(p => p.percentual = Math.round((p.quantidade / max) * 100));
    }
  }

  corBarra(i: number) { return ['#4361ee','#4cc9f0','#2ec4b6','#ff9f1c','#f72585'][i % 5]; }
}
