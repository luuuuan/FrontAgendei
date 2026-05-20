import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AgendamentoService } from '../../services/agendamento.service';
import { ProfissionalService } from '../../services/profissional.service';
import { ServicoService } from '../../services/servico.service';
import { ToastService } from '../../services/toast.service';
import { AgendamentoResponse, Profissional, Servico } from '../../models/models';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.css']
})
export class AgendaComponent implements OnInit {
  agendamentos: AgendamentoResponse[] = [];
  profissionais: Profissional[] = [];
  servicos: Servico[] = [];
  carregando = false;
  erro = '';
  modalAberto = false;
  salvando = false;
  modalDetalhesAberto = false;
  agendamentoDetalhes: AgendamentoResponse | null = null;
  atualizandoStatus = false;

  dataBusca = new Date().toISOString().split('T')[0];
  dataMinima = new Date().toISOString().split('T')[0];

  // Status disponíveis para o prestador atualizar
  statusDisponiveis = [
    { valor: 'PENDENTE',   label: 'Pendente',   classe: 'badge-warning' },
    { valor: 'CONFIRMADO', label: 'Confirmado', classe: 'badge-success' },
    { valor: 'REALIZADO',  label: 'Realizado',  classe: 'badge-info'    },
    { valor: 'CANCELADO',  label: 'Cancelado',  classe: 'badge-danger'  },
    { valor: 'AUSENTE',    label: 'Ausente',    classe: 'badge-gray'    },
  ];

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private agendamentoService: AgendamentoService,
    private profissionalService: ProfissionalService,
    private servicoService: ServicoService,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      dataAgendamento: ['', Validators.required],
      horaInicio:      ['', Validators.required],
      nomeCliente:     ['', Validators.required],
      telefoneCliente: [''],
      profissionalId:  ['', Validators.required],
      servicos:        ['', Validators.required],
      observacoes:     ['']
    });
  }

  ngOnInit() {
    this.buscarAgendamentos();
    this.profissionalService.listar().subscribe({ next: l => this.profissionais = l, error: () => {} });
    this.servicoService.listar().subscribe({ next: l => this.servicos = l, error: () => {} });
  }

  buscarAgendamentos() {
    this.carregando = true;
    this.erro = '';
    this.agendamentoService.buscarPorData(this.dataBusca).subscribe({
      next: l => { this.agendamentos = l; this.carregando = false; },
      error: (err: any) => { this.erro = err.mensagemAmigavel || 'Erro ao carregar.'; this.carregando = false; }
    });
  }

  abrirModal() { this.form.reset(); this.modalAberto = true; }
  fecharModal() { this.modalAberto = false; }
  verDetalhes(ag: AgendamentoResponse) { this.agendamentoDetalhes = ag; this.modalDetalhesAberto = true; }
  fecharDetalhes() { this.modalDetalhesAberto = false; this.agendamentoDetalhes = null; }

  salvar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.value;
    const hoje = new Date().toISOString().split('T')[0];
    if (v.dataAgendamento < hoje) { this.toast.erro('Não é possível agendar para datas passadas.'); return; }

    this.salvando = true;
    const obsCliente = 'Cliente: ' + v.nomeCliente + (v.telefoneCliente ? ' | Tel: ' + v.telefoneCliente : '');
    const obsCompleta = obsCliente + (v.observacoes ? ' | ' + v.observacoes : '');

    this.agendamentoService.criar({
      dataAgendamento: v.dataAgendamento,
      horaInicio: v.horaInicio + ':00',
      usuarioId: 0,
      profissionalId: Number(v.profissionalId),
      servicos: [Number(v.servicos)],
      observacoes: obsCompleta,
      taxaPlataforma: 0,
      statusAgendamento: 'PENDENTE'
    } as any).subscribe({
      next: () => { this.toast.sucesso('Agendamento criado!'); this.fecharModal(); this.buscarAgendamentos(); this.salvando = false; },
      error: (err: any) => { this.toast.erro(err.mensagemAmigavel || 'Erro ao criar.'); this.salvando = false; }
    });
  }

  // Atualizar status pelo prestador
  atualizarStatus(ag: AgendamentoResponse, novoStatus: string) {
    this.atualizandoStatus = true;
    this.agendamentoService.atualizarStatus(ag.id!, novoStatus).subscribe({
      next: () => {
        ag.statusAgendamento = novoStatus;
        if (this.agendamentoDetalhes?.id === ag.id) {
          this.agendamentoDetalhes!.statusAgendamento = novoStatus;
        }
        this.toast.sucesso('Status atualizado!');
        this.atualizandoStatus = false;
      },
      error: (err: any) => { this.toast.erro(err.mensagemAmigavel || 'Erro ao atualizar status.'); this.atualizandoStatus = false; }
    });
  }

  aplicarMascaraTelefone(event: any) {
    let v = event.target.value.replace(/\D/g, '').slice(0, 11);
    if (v.length <= 10) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    else v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    event.target.value = v;
    this.form.get('telefoneCliente')?.setValue(v, { emitEvent: false });
  }

  // Fix: extrai nome do cliente das observações
  nomeClienteObs(obs: string | undefined): string {
    if (!obs) return '-';
    const match = obs.match(/Cliente:\s*([^|]+)/);
    return match ? match[1].trim() : '-';
  }

  nomeProfissional(id: number | undefined) { const p = this.profissionais.find(p => p.id === id); return p?.nome || 'Profissional #' + id; }
  nomeServico(id: number) { const s = this.servicos.find(s => s.id === id); return s?.nome || 'Serviço #' + id; }
  labelStatus(s: string) { return ({ CONFIRMADO: 'Confirmado', PENDENTE: 'Pendente', CANCELADO: 'Cancelado', REALIZADO: 'Realizado', AUSENTE: 'Ausente' } as any)[s] || s; }
  classeStatus(s: string) { return ({ CONFIRMADO: 'badge-success', PENDENTE: 'badge-warning', CANCELADO: 'badge-danger', REALIZADO: 'badge-info', AUSENTE: 'badge-gray' } as any)[s] || 'badge-gray'; }
  formatarDataHora(v: string) { return v ? new Date(v).toLocaleString('pt-BR') : '-'; }
}
