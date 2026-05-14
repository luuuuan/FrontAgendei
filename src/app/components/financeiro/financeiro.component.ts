import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgendamentoService } from '../../services/agendamento.service';
import { ProfissionalService } from '../../services/profissional.service';
import { ServicoService } from '../../services/servico.service';
import { AuthService } from '../../services/auth.service';
import { AgendamentoResponse, Profissional, Servico } from '../../models/models';

@Component({
  selector: 'app-financeiro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './financeiro.component.html',
  styleUrls: ['./financeiro.component.css']
})
export class FinanceiroComponent implements OnInit {
  agendamentos: AgendamentoResponse[] = [];
  profissionais: Profissional[] = [];
  servicos: Servico[] = [];
  carregando = false;
  erro = '';
  dataBusca = new Date().toISOString().split('T')[0];

  get totalConfirmado() { return this.agendamentos.filter(a => a.statusAgendamento === 'CONFIRMADO' || a.statusAgendamento === 'REALIZADO').reduce((acc, a) => acc + (a.valorTotal || 0), 0); }
  get totalPendente()   { return this.agendamentos.filter(a => a.statusAgendamento === 'PENDENTE').reduce((acc, a) => acc + (a.valorTotal || 0), 0); }
  get totalCancelado()  { return this.agendamentos.filter(a => a.statusAgendamento === 'CANCELADO').reduce((acc, a) => acc + (a.valorTotal || 0), 0); }

  constructor(
    private agendamentoService: AgendamentoService,
    private profissionalService: ProfissionalService,
    private servicoService: ServicoService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.profissionalService.listar().subscribe({ next: l => this.profissionais = l, error: () => {} });
    this.servicoService.listar().subscribe({ next: l => this.servicos = l, error: () => {} });
    this.buscar();
  }

  buscar() {
    this.carregando = true;
    this.erro = '';
    this.agendamentoService.buscarPorData(this.dataBusca).subscribe({
      next: l => { this.agendamentos = l; this.carregando = false; },
      error: (err: any) => { this.erro = err.mensagemAmigavel || 'Erro ao carregar.'; this.agendamentos = []; this.carregando = false; }
    });
  }

  // Nome do cliente a partir das observações (agendamentos sem cadastro)
  nomeCliente(ag: AgendamentoResponse): string {
    if (ag.observacoes) {
      const match = ag.observacoes.match(/Cliente:\s*([^|]+)/);
      if (match) return match[1].trim();
    }
    return ag.usuarioId ? 'Usuário #' + ag.usuarioId : '-';
  }

  nomeProfissional(id: number) { return this.profissionais.find(p => p.id === id)?.nome || 'Profissional #' + id; }
  nomeServico(id: number) { return this.servicos.find(s => s.id === id)?.nome || 'Serviço #' + id; }
  classeStatus(s: string) { return ({ CONFIRMADO: 'badge-success', PENDENTE: 'badge-warning', CANCELADO: 'badge-danger', REALIZADO: 'badge-success', AUSENTE: 'badge-gray' } as any)[s] || 'badge-gray'; }
  labelStatus(s: string) { return ({ CONFIRMADO: 'Confirmado', PENDENTE: 'Pendente', CANCELADO: 'Cancelado', REALIZADO: 'Realizado', AUSENTE: 'Ausente' } as any)[s] || s; }
  formatarData(v: string) { return v ? new Date(v + 'T00:00:00').toLocaleDateString('pt-BR') : '-'; }
}
