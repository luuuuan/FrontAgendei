import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProfissionalService } from '../../services/profissional.service';
import { ToastService } from '../../services/toast.service';
import { GradeTrabalhoService, GradeTrabalho } from '../../services/grade-trabalho.service';
import { Profissional } from '../../models/models';

@Component({
  selector: 'app-horarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './horarios.component.html',
  styleUrls: ['./horarios.component.css']
})
export class HorariosComponent implements OnInit {

  profissionais: Profissional[] = [];
  grades: GradeTrabalho[] = [];

  profissionalSelecionadoId: number | null = null;
  carregando = false;
  carregandoGrades = false;
  salvando = false;
  excluindo: number | null = null;
  modalAberto = false;
  modoEdicao = false;
  gradeEditandoId: number | null = null;

  diasSemanaOpcoes = [
    { valor: 'SEG_SEX', label: 'Segunda a Sexta' },
    { valor: 'SEG_SAB', label: 'Segunda a Sábado' },
    { valor: 'SEG_DOM', label: 'Segunda a Domingo (todos os dias)' },
  ];

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private profissionalService: ProfissionalService,
    private gradeTrabalhoService: GradeTrabalhoService,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      diasSemana:       ['SEG_SEX', Validators.required],
      horaInicio:       ['08:00',   Validators.required],
      horaFim:          ['18:00',   Validators.required],
      temIntervalo:     [false],
      inicioIntervalo:  ['12:00'],
      fimIntervalo:     ['13:00'],
      ativo:            [true]
    });
  }

  ngOnInit() {
    this.carregarProfissionais();
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
    this.carregarGrades();
  }

  carregarGrades() {
    if (!this.profissionalSelecionadoId) return;
    this.carregandoGrades = true;
    this.grades = [];
    this.gradeTrabalhoService.buscarPorProfissional(this.profissionalSelecionadoId).subscribe({
      next: l => { this.grades = l; this.carregandoGrades = false; },
      error: () => { this.carregandoGrades = false; }
    });
  }

  get profissionalAtual(): Profissional | undefined {
    return this.profissionais.find(p => p.id === this.profissionalSelecionadoId);
  }

  abrirModal() {
    this.modoEdicao = false;
    this.gradeEditandoId = null;
    this.form.reset({
      diasSemana: 'SEG_SEX',
      horaInicio: '08:00',
      horaFim: '18:00',
      temIntervalo: false,
      inicioIntervalo: '12:00',
      fimIntervalo: '13:00',
      ativo: true
    });
    this.modalAberto = true;
  }

  abrirModalEdicao(g: GradeTrabalho) {
    this.modoEdicao = true;
    this.gradeEditandoId = g.id ?? null;
    this.form.patchValue({
      diasSemana:      g.diasSemana,
      horaInicio:      g.horaInicio,
      horaFim:         g.horaFim,
      temIntervalo:    !!(g.inicioIntervalo && g.fimIntervalo),
      inicioIntervalo: g.inicioIntervalo || '12:00',
      fimIntervalo:    g.fimIntervalo    || '13:00',
      ativo:           g.ativo
    });
    this.modalAberto = true;
  }

  fecharModal() { this.modalAberto = false; }

  salvar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.value;

    if (v.horaInicio >= v.horaFim) {
      this.toast.erro('Hora de início deve ser anterior à hora de fim.');
      return;
    }

    if (v.temIntervalo && v.inicioIntervalo >= v.fimIntervalo) {
      this.toast.erro('Início do intervalo deve ser anterior ao fim.');
      return;
    }

    const payload: GradeTrabalho = {
      profissionalId:  this.profissionalSelecionadoId!,
      diasSemana:      v.diasSemana,
      horaInicio:      v.horaInicio,
      horaFim:         v.horaFim,
      inicioIntervalo: v.temIntervalo ? v.inicioIntervalo : undefined,
      fimIntervalo:    v.temIntervalo ? v.fimIntervalo    : undefined,
      ativo:           v.ativo
    };

    this.salvando = true;

    const operacao = this.modoEdicao && this.gradeEditandoId
      ? this.gradeTrabalhoService.atualizar(this.gradeEditandoId, payload)
      : this.gradeTrabalhoService.cadastrar(payload);

    operacao.subscribe({
      next: () => {
        this.toast.sucesso(this.modoEdicao ? 'Grade atualizada!' : 'Grade cadastrada!');
        this.fecharModal();
        this.carregarGrades();
        this.salvando = false;
      },
      error: (err: any) => {
        this.toast.erro(err.mensagemAmigavel || 'Erro ao salvar.');
        this.salvando = false;
      }
    });
  }

  excluir(id: number) {
    if (!confirm('Deseja excluir esta grade de trabalho?')) return;
    this.excluindo = id;
    this.gradeTrabalhoService.excluir(id).subscribe({
      next: () => {
        this.grades = this.grades.filter(g => g.id !== id);
        this.toast.sucesso('Grade excluída.');
        this.excluindo = null;
      },
      error: (err: any) => {
        this.toast.erro(err.mensagemAmigavel || 'Erro ao excluir.');
        this.excluindo = null;
      }
    });
  }

  labelDias(valor: string): string {
    return this.diasSemanaOpcoes.find(d => d.valor === valor)?.label || valor;
  }

  iniciais(nome: string | undefined): string {
    if (!nome) return '?';
    const p = nome.trim().split(' ');
    return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
  }

  get temIntervalo(): boolean {
    return this.form.get('temIntervalo')?.value === true;
  }
}
