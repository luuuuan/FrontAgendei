import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HorarioService } from '../../services/horario.service';
import { ProfissionalService } from '../../services/profissional.service';
import { ServicoService } from '../../services/servico.service';
import { AgendamentoService } from '../../services/agendamento.service';
import { ToastService } from '../../services/toast.service';
import { HorarioDisponivel, Profissional, Servico } from '../../models/models';

interface SlotPrevia {
  horaInicio: string;
  horaFim: string;
  ocupado: boolean;
  selecionado?: boolean;
  motivoOcupado?: string;
}

@Component({
  selector: 'app-horarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './horarios.component.html',
  styleUrls: ['./horarios.component.css']
})
export class HorariosComponent implements OnInit {

  profissionais: Profissional[] = [];
  servicos: Servico[] = [];
  horarios: HorarioDisponivel[] = [];

  profissionalSelecionadoId: number | null = null;
  carregando = false;
  carregandoHorarios = false;
  salvando = false;
  excluindo: number | null = null;
  modalAberto = false;
  dataMinima = new Date().toISOString().split('T')[0];

  // Expediente do profissional
  expedienteInicio = '08:00';
  expedienteFim = '18:00';
  dataExpediente = '';
  servicoSelecionadoId: number | null = null;

  // Preview de slots gerados
  slotsPrevia: SlotPrevia[] = [];
  gerandoPrevia = false;
  horariosOcupados: string[] = []; // horarios já reservados na data

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private horarioService: HorarioService,
    private profissionalService: ProfissionalService,
    private servicoService: ServicoService,
    private agendamentoService: AgendamentoService,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      profissionalId: ['', Validators.required],
      data:           ['', Validators.required],
      horaInicio:     ['', Validators.required],
      horaFim:        ['', Validators.required],
      servicoId:      [''],
      statusHorario:         [true]
    });
  }

  ngOnInit() {
    this.carregarProfissionais();
    this.servicoService.listar().subscribe({
      next: l => this.servicos = l,
      error: () => {}
    });
  }

  carregarProfissionais() {
    this.carregando = true;
    this.profissionalService.listar().subscribe({
      next: l => { this.profissionais = l; this.carregando = false; },
      error: () => { this.carregando = false; }
    });
  }

  selecionarProfissional(id: number) {
    this.profissionalSelecionadoId = id;
    this.carregarHorarios();
  }

  carregarHorarios() {
    if (!this.profissionalSelecionadoId) return;
    this.carregandoHorarios = true;
    this.horarios = [];
    this.horarioService.listarPorProfissional(this.profissionalSelecionadoId).subscribe({
      next: l => { this.horarios = l; this.carregandoHorarios = false; },
      error: () => { this.carregandoHorarios = false; }
    });
  }

  get profissionalAtual(): Profissional | undefined {
    return this.profissionais.find(p => p.id === this.profissionalSelecionadoId);
  }

  get horariosOrdenados(): HorarioDisponivel[] {
    return [...this.horarios].sort((a, b) => {
      if (a.data < b.data) return -1;
      if (a.data > b.data) return 1;
      return a.horaInicio.localeCompare(b.horaInicio);
    });
  }

  get horariosAtivos(): number {
    return this.horarios.filter(h => h.statusHorario === 'DISPONIVEL').length;  }

  get servicoSelecionado(): Servico | undefined {
    if (!this.servicoSelecionadoId) return undefined;
    return this.servicos.find(s => s.id === this.servicoSelecionadoId);
  }

  abrirModal() {
    this.slotsPrevia = [];
    this.horariosOcupados = [];
    this.dataExpediente = '';
    this.servicoSelecionadoId = this.profissionalAtual?.servico?.[0]?.id ?? null;
    this.expedienteInicio = '08:00';
    this.expedienteFim = '18:00';
    this.modalAberto = true;
  }

  fecharModal() {
    this.modalAberto = false;
    this.slotsPrevia = [];
  }

  // Gerar slots baseados no expediente + duração do serviço + ocupados
  gerarSlots() {
    if (!this.dataExpediente) { this.toast.aviso('Selecione a data.'); return; }
    if (!this.servicoSelecionadoId) { this.toast.aviso('Selecione o servico para calcular os slots.'); return; }
    if (!this.expedienteInicio || !this.expedienteFim) { this.toast.aviso('Informe o expediente.'); return; }

    const servico = this.servicoSelecionado;
    if (!servico) { this.toast.aviso('Servico nao encontrado.'); return; }

    const duracao = servico.duracaoMinutos;
    const buffer = servico.tempoBuffer || 0;
    const intervalo = duracao + buffer;

    this.gerandoPrevia = true;
    this.slotsPrevia = [];

    // Busca horários já reservados (agendamentos existentes na data)
    this.agendamentoService.buscarHorariosDisponiveis(
      this.profissionalSelecionadoId!,
      this.dataExpediente
    ).subscribe({
      next: (disponiveis) => {
        // Os "disponiveis" do back são os livres; precisamos saber os ocupados
        // Para isso, geramos todos e marcamos os que não estão na lista de disponíveis
        this.calcularSlots(intervalo, duracao);
        this.gerandoPrevia = false;
      },
      error: () => {
        // Se der erro (ex: nenhum horário cadastrado ainda), gera tudo como disponível
        this.calcularSlots(intervalo, duracao);
        this.gerandoPrevia = false;
      }
    });
  }

  private calcularSlots(intervalo: number, duracao: number) {
    const [hI, mI] = this.expedienteInicio.split(':').map(Number);
    const [hF, mF] = this.expedienteFim.split(':').map(Number);
    let minAtual = hI * 60 + mI;
    const minFim = hF * 60 + mF;

    // Horários já cadastrados para esse profissional nessa data
    const horariosExistentes = this.horarios
      .filter(h => h.data === this.dataExpediente)
      .map(h => {
        const [hh, mm] = h.horaInicio.split(':').map(Number);
        return hh * 60 + mm;
      });

    this.slotsPrevia = [];

    while (minAtual + duracao <= minFim) {
      const hi = this.minParaHora(minAtual);
      const hf = this.minParaHora(minAtual + duracao);

      // Verifica se conflita com horário já existente
      const ocupado = horariosExistentes.some(existente => {
        // Conflita se o slot começa antes de um existente terminar E termina depois de começar
        return minAtual < existente + intervalo && minAtual + duracao > existente;
      });

      this.slotsPrevia.push({
        horaInicio: hi,
        horaFim: hf,
        ocupado,
        motivoOcupado: ocupado ? 'Conflito com horario ja cadastrado' : undefined
      });

      minAtual += intervalo;
    }

    if (this.slotsPrevia.length === 0) {
      this.toast.aviso('Nenhum slot gerado. Verifique o expediente e o servico.');
    }
  }

  private minParaHora(min: number): string {
    return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0');
  }

  get slotsDisponiveis(): SlotPrevia[] {
    return this.slotsPrevia.filter(s => !s.ocupado);
  }

  get slotsSelecionados(): SlotPrevia[] {
    return this.slotsPrevia.filter((s: any) => s.selecionado && !s.ocupado);
  }

  toggleSlot(slot: any) {
    if (slot.ocupado) return;
    slot.selecionado = !slot.selecionado;
  }

  selecionarTodos() {
    this.slotsPrevia.forEach((s: any) => { if (!s.ocupado) s.selecionado = true; });
  }

  deselecionarTodos() {
    this.slotsPrevia.forEach((s: any) => s.selecionado = false);
  }

  salvarSlotsSelecionados() {
    const selecionados = this.slotsPrevia.filter((s: any) => s.selecionado && !s.ocupado);
    if (selecionados.length === 0) { this.toast.aviso('Selecione ao menos um horario.'); return; }
    if (!this.profissionalSelecionadoId) { this.toast.aviso('Profissional nao identificado.'); return; }

    this.salvando = true;
    let salvos = 0, erros = 0;
    const total = selecionados.length;

    selecionados.forEach(slot => {
      this.horarioService.cadastrar({
        profissionalId: this.profissionalSelecionadoId!,
        data: this.dataExpediente,
        horaInicio: slot.horaInicio + ':00',
        horaFim: slot.horaFim + ':00',
        servicoId: this.servicoSelecionadoId || undefined,
      }).subscribe({
        next: () => {
          salvos++;
          if (salvos + erros === total) this.finalizarSalvamento(salvos, erros);
        },
        error: () => {
          erros++;
          if (salvos + erros === total) this.finalizarSalvamento(salvos, erros);
        }
      });
    });
  }

  finalizarSalvamento(salvos: number, erros: number) {
    this.salvando = false;
    if (erros === 0) this.toast.sucesso(salvos + ' horario(s) cadastrado(s) com sucesso!');
    else this.toast.aviso(salvos + ' cadastrado(s), ' + erros + ' com erro.');
    this.fecharModal();
    this.carregarHorarios();
  }

  excluir(id: number) {
    if (!confirm('Deseja excluir este horario?')) return;
    this.excluindo = id;
    this.horarioService.excluir(id).subscribe({
      next: () => { this.horarios = this.horarios.filter(h => h.id !== id); this.toast.sucesso('Horario excluido.'); this.excluindo = null; },
      error: (err: any) => { this.toast.erro(err.mensagemAmigavel || 'Erro ao excluir.'); this.excluindo = null; }
    });
  }

  formatarData(v: string): string {
    if (!v) return '-';
    const d = v.includes('T') ? new Date(v) : new Date(v + 'T00:00:00');
    return d.toLocaleDateString('pt-BR');
  }

  nomeServico(id: number | undefined): string {
    if (!id) return 'Sem servico';
    return this.servicos.find(s => s.id === id)?.nome || 'Servico #' + id;
  }

  iniciais(nome: string | undefined): string {
    if (!nome) return '?';
    const p = nome.trim().split(' ');
    return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
  }
}
