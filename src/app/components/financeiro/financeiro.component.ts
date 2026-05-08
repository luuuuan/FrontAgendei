import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgendamentoService } from '../../services/agendamento.service';
import { AgendamentoResponse } from '../../models/models';

@Component({
  selector: 'app-financeiro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './financeiro.component.html',
  styleUrls: ['./financeiro.component.css']
})
export class FinanceiroComponent implements OnInit {
  agendamentos: AgendamentoResponse[] = []; carregando = false; erro = '';
  dataBusca = new Date().toISOString().split('T')[0];

  get totalGeral() { return this.agendamentos.filter(a => a.statusAgendamento === 'CONFIRMADO').reduce((acc, a) => acc + (a.valorTotal || 0), 0); }
  get totalPendente() { return this.agendamentos.filter(a => a.statusAgendamento === 'PENDENTE').reduce((acc, a) => acc + (a.valorTotal || 0), 0); }
  get totalCancelado() { return this.agendamentos.filter(a => a.statusAgendamento === 'CANCELADO').reduce((acc, a) => acc + (a.valorTotal || 0), 0); }

  constructor(private agendamentoService: AgendamentoService) {}
  ngOnInit() { this.buscar(); }

  buscar() {
    this.carregando = true; this.erro = '';
    this.agendamentoService.buscarPorData(this.dataBusca).subscribe({
      next: l => { this.agendamentos = l; this.carregando = false; },
      error: (err: any) => { this.erro = err.mensagemAmigavel || 'Erro ao carregar.'; this.agendamentos = []; this.carregando = false; }
    });
  }

  classeStatus(s: string) { return ({ CONFIRMADO: 'badge-success', PENDENTE: 'badge-warning', CANCELADO: 'badge-danger' } as any)[s] || 'badge-gray'; }
  labelStatus(s: string) { return ({ CONFIRMADO: 'Confirmado', PENDENTE: 'Pendente', CANCELADO: 'Cancelado' } as any)[s] || s; }
  formatarData(v: string) { return v ? new Date(v).toLocaleDateString('pt-BR') : '-'; }
}
