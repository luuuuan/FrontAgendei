import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProfissionalService } from '../../services/profissional.service';
import { ToastService } from '../../services/toast.service';
import { GradeTrabalhoService, GradeTrabalho } from '../../services/grade-trabalho.service';
import { FolgaService, Folga } from '../../services/folga.service';
import { Profissional } from '../../models/models';
import { AuthService } from '../../services/auth.service';

type AbaAtiva = 'grade' | 'folgas';

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
  folgas: Folga[] = [];

  profissionalSelecionadoId: number | null = null;
  modoAutonomo = false; // true quando prestador não tem profissionais
  prestadorId: number | null = null;
  carregando = false;
  carregandoGrades = false;
  carregandoFolgas = false;
  salvando = false;
  excluindo: number | null = null;
  abaAtiva: AbaAtiva = 'grade';

  // Modal grade
  modalGradeAberto = false;
  modoEdicaoGrade = false;
  gradeEditandoId: number | null = null;

  // Modal folga
  modalFolgaAberto = false;
  folgaDiaInteiro = true;
  dataMinima = new Date().toISOString().split('T')[0];

  diasSemanaOpcoes = [
    { valor: 'SEG_SEX', label: 'Segunda a Sexta' },
    { valor: 'SEG_SAB', label: 'Segunda a Sábado' },
    { valor: 'SEG_DOM', label: 'Segunda a Domingo (todos os dias)' },
  ];

  formGrade: FormGroup;
  formFolga: FormGroup;

  constructor(
    private fb: FormBuilder,
    private profissionalService: ProfissionalService,
    private gradeTrabalhoService: GradeTrabalhoService,
    private folgaService: FolgaService,
    private toast: ToastService,
    private authService: AuthService
  ) {
    this.formGrade = this.fb.group({
      diasSemana:      ['SEG_SEX', Validators.required],
      horaInicio:      ['08:00',   Validators.required],
      horaFim:         ['18:00',   Validators.required],
      temIntervalo:    [false],
      inicioIntervalo: ['12:00'],
      fimIntervalo:    ['13:00'],
      ativo:           [true]
    });

    this.formFolga = this.fb.group({
      data:       ['', Validators.required],
      diaInteiro: [true],
      horaInicio: [''],
      horaFim:    [''],
      motivo:     ['']
    });
  }

  ngOnInit() {
    const sessao = this.authService.getSessao();
    this.prestadorId = sessao?.prestadorId ?? null;
    this.carregarProfissionais();
  }

  carregarProfissionais() {
    this.carregando = true;
    this.profissionalService.listar().subscribe({
      next: l => {
        this.profissionais = l;
        this.carregando = false;
        // Se não tem profissionais, ativa modo autônomo e carrega grade do prestador
        if (l.length === 0) {
          this.modoAutonomo = true;
          this.carregarGradesPrestador();
          this.carregarFolgasPrestador();
        }
      },
      error: () => { this.carregando = false; }
    });
  }

  carregarGradesPrestador() {
    if (!this.prestadorId) return;
    this.carregandoGrades = true;
    this.gradeTrabalhoService.buscarPorPrestador(this.prestadorId).subscribe({
      next: l => { this.grades = l; this.carregandoGrades = false; },
      error: () => { this.carregandoGrades = false; }
    });
  }

  carregarFolgasPrestador() {
    if (!this.prestadorId) return;
    this.carregandoFolgas = true;
    this.folgaService.buscarPorPrestador(this.prestadorId).subscribe({
      next: l => { this.folgas = l.sort((a, b) => a.data.localeCompare(b.data)); this.carregandoFolgas = false; },
      error: () => { this.carregandoFolgas = false; }
    });
  }

  selecionarProfissional(id: number) {
    this.profissionalSelecionadoId = id;
    this.carregarGrades();
    this.carregarFolgas();
  }

  carregarGrades() {
    if (!this.profissionalSelecionadoId) return;
    this.carregandoGrades = true;
    this.gradeTrabalhoService.buscarPorProfissional(this.profissionalSelecionadoId).subscribe({
      next: l => { this.grades = l; this.carregandoGrades = false; },
      error: () => { this.carregandoGrades = false; }
    });
  }

  carregarFolgas() {
    if (!this.profissionalSelecionadoId) return;
    this.carregandoFolgas = true;
    this.folgaService.buscarPorProfissional(this.profissionalSelecionadoId).subscribe({
      next: l => { this.folgas = l.sort((a, b) => a.data.localeCompare(b.data)); this.carregandoFolgas = false; },
      error: () => { this.carregandoFolgas = false; }
    });
  }

  get profissionalAtual(): Profissional | undefined {
    return this.profissionais.find(p => p.id === this.profissionalSelecionadoId);
  }

  // === GRADE ===
  abrirModalGrade() {
    this.modoEdicaoGrade = false;
    this.gradeEditandoId = null;
    this.formGrade.reset({ diasSemana: 'SEG_SEX', horaInicio: '08:00', horaFim: '18:00', temIntervalo: false, inicioIntervalo: '12:00', fimIntervalo: '13:00', ativo: true });
    this.modalGradeAberto = true;
  }

  abrirModalEdicaoGrade(g: GradeTrabalho) {
    this.modoEdicaoGrade = true;
    this.gradeEditandoId = g.id ?? null;
    this.formGrade.patchValue({
      diasSemana: g.diasSemana, horaInicio: g.horaInicio, horaFim: g.horaFim,
      temIntervalo: !!(g.inicioIntervalo && g.fimIntervalo),
      inicioIntervalo: g.inicioIntervalo || '12:00', fimIntervalo: g.fimIntervalo || '13:00', ativo: g.ativo
    });
    this.modalGradeAberto = true;
  }

  fecharModalGrade() { this.modalGradeAberto = false; }

  salvarGrade() {
    if (this.formGrade.invalid) { this.formGrade.markAllAsTouched(); return; }
    const v = this.formGrade.value;
    if (v.horaInicio >= v.horaFim) { this.toast.erro('Hora de início deve ser anterior à hora de fim.'); return; }
    if (v.temIntervalo && v.inicioIntervalo >= v.fimIntervalo) { this.toast.erro('Início do intervalo deve ser anterior ao fim.'); return; }

    const payload: GradeTrabalho = {
      profissionalId:  this.modoAutonomo ? undefined : this.profissionalSelecionadoId!,
      prestadorId:     this.modoAutonomo ? this.prestadorId! : undefined,
      diasSemana:      v.diasSemana,
      horaInicio:      v.horaInicio,
      horaFim:         v.horaFim,
      inicioIntervalo: v.temIntervalo ? v.inicioIntervalo : undefined,
      fimIntervalo:    v.temIntervalo ? v.fimIntervalo    : undefined,
      ativo:           v.ativo
    };

    this.salvando = true;
    const op = this.modoEdicaoGrade && this.gradeEditandoId
      ? this.gradeTrabalhoService.atualizar(this.gradeEditandoId, payload)
      : this.gradeTrabalhoService.cadastrar(payload);

    op.subscribe({
      next: () => { this.toast.sucesso(this.modoEdicaoGrade ? 'Grade atualizada!' : 'Grade cadastrada!'); this.fecharModalGrade(); this.carregarGrades(); this.salvando = false; },
      error: (err: any) => { this.toast.erro(err.mensagemAmigavel || 'Erro ao salvar.'); this.salvando = false; }
    });
  }

  excluirGrade(id: number) {
    if (!confirm('Deseja excluir esta grade de trabalho?')) return;
    this.excluindo = id;
    this.gradeTrabalhoService.excluir(id).subscribe({
      next: () => { this.grades = this.grades.filter(g => g.id !== id); this.toast.sucesso('Grade excluída.'); this.excluindo = null; },
      error: (err: any) => { this.toast.erro(err.mensagemAmigavel || 'Erro ao excluir.'); this.excluindo = null; }
    });
  }

  // === FOLGAS ===
  abrirModalFolga() {
    this.formFolga.reset({ diaInteiro: true, horaInicio: '08:00', horaFim: '12:00' });
    this.folgaDiaInteiro = true;
    this.modalFolgaAberto = true;
  }

  fecharModalFolga() { this.modalFolgaAberto = false; }

  onDiaInteiroChange() {
    this.folgaDiaInteiro = this.formFolga.get('diaInteiro')?.value;
  }

  salvarFolga() {
    const v = this.formFolga.value;
    if (!v.data) { this.toast.aviso('Selecione a data da folga.'); return; }
    if (!v.diaInteiro && (!v.horaInicio || !v.horaFim)) { this.toast.aviso('Informe o período da folga.'); return; }
    if (!v.diaInteiro && v.horaInicio >= v.horaFim) { this.toast.erro('Hora de início deve ser anterior à hora de fim.'); return; }

    const payload: Folga = {
      profissionalId: this.profissionalSelecionadoId!,
      data:       v.data,
      diaInteiro: v.diaInteiro,
      horaInicio: v.diaInteiro ? undefined : v.horaInicio,
      horaFim:    v.diaInteiro ? undefined : v.horaFim,
      motivo:     v.motivo || undefined
    };

    this.salvando = true;
    this.folgaService.cadastrar(payload).subscribe({
      next: () => { this.toast.sucesso('Folga cadastrada!'); this.fecharModalFolga(); this.carregarFolgas(); this.salvando = false; },
      error: (err: any) => { this.toast.erro(err.mensagemAmigavel || 'Erro ao salvar folga.'); this.salvando = false; }
    });
  }

  excluirFolga(id: number) {
    if (!confirm('Deseja remover esta folga?')) return;
    this.excluindo = id;
    this.folgaService.excluir(id).subscribe({
      next: () => { this.folgas = this.folgas.filter(f => f.id !== id); this.toast.sucesso('Folga removida.'); this.excluindo = null; },
      error: (err: any) => { this.toast.erro(err.mensagemAmigavel || 'Erro ao remover.'); this.excluindo = null; }
    });
  }
  

  get folgasFuturas(): Folga[] {
    const hoje = new Date().toISOString().split('T')[0];
    return this.folgas.filter(f => f.data >= hoje);
  }

  get folgasPassadas(): Folga[] {
    const hoje = new Date().toISOString().split('T')[0];
    return this.folgas.filter(f => f.data < hoje);
  }

  labelDias(valor: string): string {
    return this.diasSemanaOpcoes.find(d => d.valor === valor)?.label || valor;
  }

  formatarData(v: string): string {
    if (!v) return '-';
    const d = new Date(v + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  iniciais(nome: string | undefined): string {
    if (!nome) return '?';
    const p = nome.trim().split(' ');
    return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
  }

  get temIntervalo(): boolean { return this.formGrade.get('temIntervalo')?.value === true; }
}
