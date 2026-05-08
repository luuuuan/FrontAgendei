import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HorarioService } from '../../services/horario.service';
import { ProfissionalService } from '../../services/profissional.service';
import { ServicoService } from '../../services/servico.service';
import { ToastService } from '../../services/toast.service';
import { HorarioDisponivel, Profissional, Servico } from '../../models/models';

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

  form: FormGroup;

  // Geração em lote
  modoLote = false;
  loteHoraInicio = '';
  loteHoraFim = '';
  loteIntervalo = 30;
  loteData = '';
  lotePrevia: string[] = [];

  constructor(
    private fb: FormBuilder,
    private horarioService: HorarioService,
    private profissionalService: ProfissionalService,
    private servicoService: ServicoService,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      profissionalId: ['', Validators.required],
      data: ['', Validators.required],
      horaInicio: ['', Validators.required],
      horaFim: ['', Validators.required],
      servicoId: [''],
      status: [true]
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
    return this.horarios.filter(h => h.status).length;
  }

  abrirModal() {
    this.modoLote = false;
    this.lotePrevia = [];
    this.form.reset({
      profissionalId: this.profissionalSelecionadoId,
      status: true
    });
    this.modalAberto = true;
  }

  fecharModal() {
    this.modalAberto = false;
    this.lotePrevia = [];
  }

  gerarPrevia() {
    if (!this.loteHoraInicio || !this.loteHoraFim || !this.loteIntervalo) return;
    this.lotePrevia = [];
    const [hI, mI] = this.loteHoraInicio.split(':').map(Number);
    const [hF, mF] = this.loteHoraFim.split(':').map(Number);
    let totalMinInicio = hI * 60 + mI;
    const totalMinFim = hF * 60 + mF;

    while (totalMinInicio + this.loteIntervalo <= totalMinFim) {
      const hi = `${String(Math.floor(totalMinInicio / 60)).padStart(2, '0')}:${String(totalMinInicio % 60).padStart(2, '0')}`;
      const hfMin = totalMinInicio + this.loteIntervalo;
      const hf = `${String(Math.floor(hfMin / 60)).padStart(2, '0')}:${String(hfMin % 60).padStart(2, '0')}`;
      this.lotePrevia.push(`${hi} – ${hf}`);
      totalMinInicio += this.loteIntervalo;
    }
  }

  salvarLote() {
    if (!this.loteData || !this.loteHoraInicio || !this.loteHoraFim || !this.profissionalSelecionadoId) {
      this.toast.aviso('Preencha data, hora início e hora fim.');
      return;
    }
    if (this.lotePrevia.length === 0) {
      this.toast.aviso('Gere a prévia antes de salvar.');
      return;
    }

    this.salvando = true;
    const slots = this.lotePrevia.map(p => {
      const [hi, hf] = p.split(' – ');
      return {
        profissionalId: this.profissionalSelecionadoId!,
        data: this.loteData,
        horaInicio: hi + ':00',
        horaFim: hf + ':00',
        status: true
      };
    });

    let salvos = 0;
    let erros = 0;
    const total = slots.length;

    slots.forEach(slot => {
      this.horarioService.cadastrar(slot).subscribe({
        next: () => {
          salvos++;
          if (salvos + erros === total) {
            this.finalizarSalvamento(salvos, erros);
          }
        },
        error: () => {
          erros++;
          if (salvos + erros === total) {
            this.finalizarSalvamento(salvos, erros);
          }
        }
      });
    });
  }

  finalizarSalvamento(salvos: number, erros: number) {
    this.salvando = false;
    if (erros === 0) {
      this.toast.sucesso(`${salvos} horário(s) cadastrado(s) com sucesso!`);
    } else {
      this.toast.aviso(`${salvos} cadastrado(s), ${erros} com erro.`);
    }
    this.fecharModal();
    this.carregarHorarios();
  }

  salvarUnico() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.value;

    if (v.horaInicio >= v.horaFim) {
      this.toast.erro('A hora de início deve ser anterior à hora de fim.');
      return;
    }

    this.salvando = true;
    const payload = {
      profissionalId: Number(v.profissionalId),
      data: v.data,
      horaInicio: v.horaInicio + ':00',
      horaFim: v.horaFim + ':00',
      servicoId: v.servicoId ? Number(v.servicoId) : undefined,
      status: v.status
    };

    this.horarioService.cadastrar(payload).subscribe({
      next: () => {
        this.toast.sucesso('Horário cadastrado com sucesso!');
        this.fecharModal();
        this.carregarHorarios();
        this.salvando = false;
      },
      error: (err: any) => {
        this.toast.erro(err.mensagemAmigavel || 'Erro ao cadastrar horário.');
        this.salvando = false;
      }
    });
  }

  excluir(id: number) {
    if (!confirm('Deseja excluir este horário?')) return;
    this.excluindo = id;
    this.horarioService.excluir(id).subscribe({
      next: () => {
        this.horarios = this.horarios.filter(h => h.id !== id);
        this.toast.sucesso('Horário excluído.');
        this.excluindo = null;
      },
      error: (err: any) => {
        this.toast.erro(err.mensagemAmigavel || 'Erro ao excluir.');
        this.excluindo = null;
      }
    });
  }

  formatarData(v: string): string {
    if (!v) return '-';
    const d = v.includes('T') ? new Date(v) : new Date(v + 'T00:00:00');
    return d.toLocaleDateString('pt-BR');
  }

  nomeServico(id: number | undefined): string {
    if (!id) return '—';
    return this.servicos.find(s => s.id === id)?.nome || `Serviço #${id}`;
  }

  iniciais(nome: string | undefined): string {
    if (!nome) return '?';
    const p = nome.trim().split(' ');
    return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
  }
}
