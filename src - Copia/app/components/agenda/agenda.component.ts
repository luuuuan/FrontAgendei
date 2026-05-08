import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AgendamentoService } from '../../services/agendamento.service';
import { ProfissionalService } from '../../services/profissional.service';
import { ServicoService } from '../../services/servico.service';
import { UsuarioService } from '../../services/usuario.service';
import { ToastService } from '../../services/toast.service';
import { AgendamentoResponse, Profissional, Servico, Usuario } from '../../models/models';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.css']
})
export class AgendaComponent implements OnInit {
  agendamentos: AgendamentoResponse[] = [];
  profissionais: Profissional[] = []; servicos: Servico[] = []; usuarios: Usuario[] = [];
  carregando = false; erro = ''; modalAberto = false; salvando = false;
  modalDetalhesAberto = false; agendamentoDetalhes: AgendamentoResponse | null = null;
  dataBusca = new Date().toISOString().split('T')[0];
  dataMinima = new Date().toISOString().split('T')[0];
  form: FormGroup;

  constructor(
    private fb: FormBuilder, private agendamentoService: AgendamentoService,
    private profissionalService: ProfissionalService, private servicoService: ServicoService,
    private usuarioService: UsuarioService, private toast: ToastService
  ) {
    this.form = this.fb.group({
      dataAgendamento: ['', Validators.required], horaInicio: ['', Validators.required],
      usuarioId: ['', Validators.required], profissionalId: ['', Validators.required],
      servicos: ['', Validators.required], observacoes: ['']
    });
  }

  ngOnInit() {
    this.buscarAgendamentos();
    this.profissionalService.listar().subscribe({ next: l => this.profissionais = l, error: () => {} });
    this.servicoService.listar().subscribe({ next: l => this.servicos = l, error: () => {} });
    this.usuarioService.listar().subscribe({ next: l => this.usuarios = l, error: () => {} });
  }

  buscarAgendamentos() {
    this.carregando = true; this.erro = '';
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
    if (v.dataAgendamento < hoje) {
      this.toast.erro('Não é possível agendar para datas passadas.');
      return;
    }
    this.salvando = true;
    const dataHora = `${v.dataAgendamento}T${v.horaInicio}:00`;
    this.agendamentoService.criar({ dataAgendamento: dataHora, horaInicio: dataHora, usuarioId: Number(v.usuarioId), profissionalId: Number(v.profissionalId), servicos: [Number(v.servicos)], observacoes: v.observacoes || '', taxaPlataforma: 0, statusAgendamento: 'PENDENTE' } as any).subscribe({
      next: () => { this.toast.sucesso('Agendamento criado!'); this.fecharModal(); this.buscarAgendamentos(); this.salvando = false; },
      error: (err: any) => { this.toast.erro(err.mensagemAmigavel || 'Erro ao criar.'); this.salvando = false; }
    });
  }

  nomeProfissional(id: number) { const p = this.profissionais.find(p => p.id === id); return p?.nome || `Profissional #${id}`; }
  nomeUsuario(id: number) { const u = this.usuarios.find(u => u.id === id); return u?.nome || `Usuário #${id}`; }
  nomeServico(id: number) { const s = this.servicos.find(s => s.id === id); return s?.nome || `Serviço #${id}`; }
  labelStatus(s: string) { return ({ CONFIRMADO: 'Confirmado', PENDENTE: 'Pendente', CANCELADO: 'Cancelado' } as any)[s] || s; }
  classeStatus(s: string) { return ({ CONFIRMADO: 'badge-success', PENDENTE: 'badge-warning', CANCELADO: 'badge-danger' } as any)[s] || 'badge-gray'; }
  formatarDataHora(v: string) { return v ? new Date(v).toLocaleString('pt-BR') : '-'; }
}
