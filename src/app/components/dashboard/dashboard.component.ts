import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../services/usuario.service';
import { ServicoService } from '../../services/servico.service';
import { ProfissionalService } from '../../services/profissional.service';
import { AgendamentoService } from '../../services/agendamento.service';
import { AgendamentoResponse, Profissional, Servico } from '../../models/models';
import { HttpClient } from '@angular/common/http';
import { FolgaService, Folga } from '../../services/folga.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
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
  agendamentosDiaSelecionado: AgendamentoResponse[] = [];
  diaSelecionado: number | null = null;
  profissionais: Profissional[] = [];
  servicos: Servico[] = [];
  carregandoDia = false;
  agendamentosMes: AgendamentoResponse[] = [];
  feriados: { data: string; nome: string }[] = [];
  diasBloqueados: string[] = []; // dias bloqueados pelo prestador
  carregandoFeriados = false;
  salvandoBloqueio = false;
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
    private agendamentoService: AgendamentoService,
    private http: HttpClient,
    private authService: AuthService,
    private folgaService: FolgaService
  ) { }

  ngOnInit() {
    this.gerarCalendario();
    this.carregarAgendamentosMes();
    this.carregarFeriados();
    this.carregarDiasBloqueados();
    this.carregandoClientes = true;
    this.usuarioService.listar().subscribe({ next: (l) => { this.totalClientes = l.length; this.carregandoClientes = false; this.verificarCarregamentoInicial(); }, error: () => { this.carregandoClientes = false; this.verificarCarregamentoInicial(); } });
    this.carregandoServicos = true;
    this.servicoService.listar().subscribe({ next: (l) => { this.totalServicos = l.length; this.carregandoServicos = false; this.verificarCarregamentoInicial(); }, error: () => { this.carregandoServicos = false; this.verificarCarregamentoInicial(); } });
    this.carregandoProfissionais = true;
    this.profissionalService.listar().subscribe({ next: (l) => { this.totalProfissionais = l.length; this.carregandoProfissionais = false; this.verificarCarregamentoInicial(); }, error: () => { this.carregandoProfissionais = false; this.verificarCarregamentoInicial(); } });
    this.profissionalService.listar().subscribe({ next: l => this.profissionais = l, error: () => {} });
    this.servicoService.listar().subscribe({ next: l => this.servicos = l, error: () => {} });
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

  selecionarDia(dia: number | null) {
    if (!dia) return;
    this.diaSelecionado = dia;
    const ano = this.dataAtual.getFullYear();
    const mes = String(this.dataAtual.getMonth() + 1).padStart(2, '0');
    const diaStr = String(dia).padStart(2, '0');
    const data = `${ano}-${mes}-${diaStr}`;
    this.carregandoDia = true;
    this.agendamentoService.buscarPorData(data).subscribe({
      next: l => { this.agendamentosDiaSelecionado = l; this.carregandoDia = false; },
      error: () => { this.carregandoDia = false; }
    });
  }

  nomeProfissional(id: number | undefined): string {
    if (!id) return 'Prestador';
    return this.profissionais.find(p => p.id === id)?.nome || 'Prof. #' + id;
  }

  nomeServico(id: number): string {
    return this.servicos.find(s => s.id === id)?.nome || 'Serv. #' + id;
  }

  carregarAgendamentosMes() {
    const ano = this.dataAtual.getFullYear();
    const mes = String(this.dataAtual.getMonth() + 1).padStart(2, '0');
    const inicio = `${ano}-${mes}-01`;
    const ultimoDia = new Date(ano, this.dataAtual.getMonth() + 1, 0).getDate();
    const fim = `${ano}-${mes}-${String(ultimoDia).padStart(2, '0')}`;
    this.agendamentoService.buscarPorPeriodo(inicio, fim).subscribe({
      next: l => this.agendamentosMes = l,
      error: () => {}
    });
  }

  diasComAgendamento(dia: number): number {
    const ano = this.dataAtual.getFullYear();
    const mes = String(this.dataAtual.getMonth() + 1).padStart(2, '0');
    const diaStr = `${ano}-${mes}-${String(dia).padStart(2, '0')}`;
    return this.agendamentosMes.filter(a => a.dataAgendamento === diaStr).length;
  }

  carregarFeriados() {
    const ano = this.dataAtual.getFullYear();
    this.carregandoFeriados = true;
    // Google Calendar API - feriados brasileiros
    const calId = 'pt.brazilian%23holiday%40group.v.calendar.google.com';
    const apiKey = 'AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY'; // chave pública de exemplo
    const timeMin = `${ano}-01-01T00:00:00Z`;
    const timeMax = `${ano}-12-31T23:59:59Z`;
    this.http.get<any>(
      `https://www.googleapis.com/calendar/v3/calendars/${calId}/events?key=${apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`
    ).subscribe({
      next: (res) => {
        this.feriados = (res.items || []).map((item: any) => ({
          data: item.start?.date || item.start?.dateTime?.substring(0, 10),
          nome: item.summary
        }));
        this.carregandoFeriados = false;
      },
      error: () => { this.carregandoFeriados = false; }
    });
  }

  ehFeriado(dia: number): string | null {
    const ano = this.dataAtual.getFullYear();
    const mes = String(this.dataAtual.getMonth() + 1).padStart(2, '0');
    const diaStr = `${ano}-${mes}-${String(dia).padStart(2, '0')}`;
    const feriado = this.feriados.find(f => f.data === diaStr);
    return feriado?.nome || null;
  }

  carregarDiasBloqueados() {
    const sessao = this.authService.getSessao();
    if (!sessao?.prestadorId) return;
    const ano = this.dataAtual.getFullYear();
    const mes = String(this.dataAtual.getMonth() + 1).padStart(2, '0');
    this.folgaService.buscarDiasBloqueadosPorMes(sessao.prestadorId, `${ano}-${mes}`).subscribe({
      next: l => this.diasBloqueados = l,
      error: () => {}
    });
  }

  ehDiaBloqueado(dia: number): boolean {
    const ano = this.dataAtual.getFullYear();
    const mes = String(this.dataAtual.getMonth() + 1).padStart(2, '0');
    const diaStr = `${ano}-${mes}-${String(dia).padStart(2, '0')}`;
    return this.diasBloqueados.includes(diaStr);
  }

  toggleBloqueio(dia: number) {
    const sessao = this.authService.getSessao();
    if (!sessao?.prestadorId || !dia) return;
    const ano = this.dataAtual.getFullYear();
    const mes = String(this.dataAtual.getMonth() + 1).padStart(2, '0');
    const diaStr = `${ano}-${mes}-${String(dia).padStart(2, '0')}`;
    this.salvandoBloqueio = true;

    if (this.ehDiaBloqueado(dia)) {
      this.folgaService.desativarPorData(sessao.prestadorId, diaStr).subscribe({
        next: () => { this.diasBloqueados = this.diasBloqueados.filter(d => d !== diaStr); this.salvandoBloqueio = false; },
        error: () => { this.salvandoBloqueio = false; }
      });
    } else {
      this.folgaService.cadastrar({ prestadorId: sessao.prestadorId, data: diaStr, diaInteiro: true, motivo: 'Dia bloqueado pelo prestador' }).subscribe({
        next: () => { this.diasBloqueados.push(diaStr); this.salvandoBloqueio = false; },
        error: () => { this.salvandoBloqueio = false; }
      });
    }
  }

  mesAnterior() { this.dataAtual = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth() - 1, 1); this.gerarCalendario(); this.carregarAgendamentosMes(); this.carregarFeriados(); this.carregarDiasBloqueados(); }
  mesSeguinte() { this.dataAtual = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth() + 1, 1); this.gerarCalendario(); this.carregarAgendamentosMes(); this.carregarFeriados(); this.carregarDiasBloqueados(); }

  ehHoje(dia: number | null): boolean {
    if (!dia) return false;
    const hoje = new Date();
    return dia === hoje.getDate() && this.dataAtual.getMonth() === hoje.getMonth() && this.dataAtual.getFullYear() === hoje.getFullYear();
  }

  labelStatus(s: string) { return ({ CONFIRMADO: 'Confirmado', PENDENTE: 'Pendente', CANCELADO: 'Cancelado' } as any)[s] || s; }
  classeStatus(s: string) { return ({ CONFIRMADO: 'badge-success', PENDENTE: 'badge-warning', CANCELADO: 'badge-danger' } as any)[s] || 'badge-gray'; }
  formatarDataHora(v: string) { return v ? new Date(v).toLocaleString('pt-BR') : '-'; }
}
