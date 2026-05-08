import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../services/usuario.service';
import { ServicoService } from '../../services/servico.service';
import { ProfissionalService } from '../../services/profissional.service';
import { AgendamentoService } from '../../services/agendamento.service';
import { AgendamentoResponse } from '../../models/models';
import { SkeletonComponent } from '../skeleton/skeleton.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  totalClientes = 0;
  totalServicos = 0;
  totalProfissionais = 0;
  agendamentosHoje: AgendamentoResponse[] = [];
  carregandoClientes = false; carregandoServicos = false;
  carregandoProfissionais = false; carregandoAgendamentos = false;
  carregandoInicial = true;
  dataAtual = new Date();
  diasDoMes: (number | null)[] = [];
  mesLabel = '';
  diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  constructor(
    private usuarioService: UsuarioService,
    private servicoService: ServicoService,
    private profissionalService: ProfissionalService,
    private agendamentoService: AgendamentoService
  ) { }

  ngOnInit() {
    this.gerarCalendario();
    this.carregandoClientes = true;
    this.usuarioService.listar().subscribe({ next: (l) => { this.totalClientes = l.length; this.carregandoClientes = false; this.verificarCarregamentoInicial(); }, error: () => { this.carregandoClientes = false; this.verificarCarregamentoInicial(); } });
    this.carregandoServicos = true;
    this.servicoService.listar().subscribe({ next: (l) => { this.totalServicos = l.length; this.carregandoServicos = false; this.verificarCarregamentoInicial(); }, error: () => { this.carregandoServicos = false; this.verificarCarregamentoInicial(); } });
    this.carregandoProfissionais = true;
    this.profissionalService.listar().subscribe({ next: (l) => { this.totalProfissionais = l.length; this.carregandoProfissionais = false; this.verificarCarregamentoInicial(); }, error: () => { this.carregandoProfissionais = false; this.verificarCarregamentoInicial(); } });
    this.carregandoAgendamentos = true;
    const hoje = new Date().toISOString().split('T')[0];
    this.agendamentoService.buscarPorData(hoje).subscribe({
      next: (l) => {
        this.agendamentosHoje = l;
        this.carregandoAgendamentos = false;
        this.verificarCarregamentoInicial();
      },
      error: () => { this.carregandoAgendamentos = false; this.verificarCarregamentoInicial(); }
    });
  }

  verificarCarregamentoInicial() {
    if (!this.carregandoClientes && !this.carregandoServicos && !this.carregandoProfissionais && !this.carregandoAgendamentos) {
      this.carregandoInicial = false;
    }
  }

  gerarCalendario() {
    const ano = this.dataAtual.getFullYear(), mes = this.dataAtual.getMonth();
    this.mesLabel = this.dataAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const totalDias = new Date(ano, mes + 1, 0).getDate();
    this.diasDoMes = [];
    for (let i = 0; i < primeiroDia; i++) this.diasDoMes.push(null);
    for (let d = 1; d <= totalDias; d++) this.diasDoMes.push(d);
  }

  mesAnterior() { this.dataAtual = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth() - 1, 1); this.gerarCalendario(); }
  mesSeguinte() { this.dataAtual = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth() + 1, 1); this.gerarCalendario(); }

  ehHoje(dia: number | null): boolean {
    if (!dia) return false;
    const hoje = new Date();
    return dia === hoje.getDate() && this.dataAtual.getMonth() === hoje.getMonth() && this.dataAtual.getFullYear() === hoje.getFullYear();
  }

  labelStatus(s: string) { return ({ CONFIRMADO: 'Confirmado', PENDENTE: 'Pendente', CANCELADO: 'Cancelado' } as any)[s] || s; }
  classeStatus(s: string) { return ({ CONFIRMADO: 'badge-success', PENDENTE: 'badge-warning', CANCELADO: 'badge-danger' } as any)[s] || 'badge-gray'; }
  formatarDataHora(v: string) { return v ? new Date(v).toLocaleString('pt-BR') : '-'; }
}
