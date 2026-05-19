import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ServicoService } from '../../services/servico.service';
import { ProfissionalService } from '../../services/profissional.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Servico, Profissional } from '../../models/models';

@Component({
  selector: 'app-servicos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SkeletonComponent],
  templateUrl: './servicos.component.html',
  styleUrls: ['./servicos.component.css']
})
export class ServicosComponent implements OnInit {
  servicos: Servico[] = [];
  servicosFiltrados: Servico[] = [];
  profissionais: Profissional[] = [];
  carregando = false;
  erro = '';
  modalAberto = false;
  salvando = false;
  termoBusca = '';
  modoEdicao = false;
  servicoEditandoId: number | null = null;

  tiposCobranca = [
    { valor: 'FIXO',          label: 'Valor fixo',        unidade: '' },
    { valor: 'HORA',          label: 'Por hora',           unidade: '/hora' },
    { valor: 'METRO_QUADRADO',label: 'Por m²',             unidade: '/m²' },
    { valor: 'METRO_LINEAR',  label: 'Por metro linear',   unidade: '/ml' },
    { valor: 'UNIDADE',       label: 'Por unidade/ponto',  unidade: '/un' },
    { valor: 'DIARIA',        label: 'Por diária',         unidade: '/dia' },
    { valor: 'PERCENTUAL',    label: 'Percentual (%)',      unidade: '%' },
  ];

  locaisAtendimento = [
    { valor: 'NO_LOCAL',   label: 'No estabelecimento' },
    { valor: 'DOMICILIO',  label: 'No domicílio do cliente' },
    { valor: 'AMBOS',      label: 'Ambos' },
  ];

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private servicoService: ServicoService,
    private profissionalService: ProfissionalService,
    private authService: AuthService,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      nome:                  ['', Validators.required],
      descricao:             ['', Validators.required],
      duracaoMinutos:        ['', [Validators.required, Validators.min(1)]],
      tempoBuffer:           [0],
      tipoCobranca:          ['FIXO', Validators.required],
      valorServico:          ['', [Validators.required, Validators.min(0)]],
      localAtendimento:      ['NO_LOCAL', Validators.required],
      profissionalId:        ['', Validators.required],
      statusServico:         ['ATIVO'],
      statusExecucaoServico: ['PENDENTE']
    });
  }

  ngOnInit() {
    this.carregarServicos();
    this.profissionalService.listar().subscribe({
      next: l => this.profissionais = l,
      error: () => {}
    });
  }

  carregarServicos() {
    this.carregando = true;
    this.erro = '';
    const sessao = this.authService.getSessao();
    this.servicoService.listarPorPrestador(sessao?.prestadorId).subscribe({
      next: l => { this.servicos = l; this.servicosFiltrados = l; this.carregando = false; },
      error: (err: any) => { this.erro = err.mensagemAmigavel || 'Erro ao carregar.'; this.carregando = false; }
    });
  }

  filtrar() {
    const t = this.termoBusca.toLowerCase().trim();
    this.servicosFiltrados = t
      ? this.servicos.filter(s =>
          s.nome?.toLowerCase().includes(t) ||
          s.descricao?.toLowerCase().includes(t) ||
          this.nomeProfissional(s.profissionalId).toLowerCase().includes(t)
        )
      : this.servicos;
  }

  nomeProfissional(id: number) {
    return this.profissionais.find(p => p.id === id)?.nome || `Profissional #${id}`;
  }

  labelTipoCobranca(tipo: string): string {
    return this.tiposCobranca.find(t => t.valor === tipo)?.label || tipo;
  }

  unidadeTipoCobranca(tipo: string): string {
    return this.tiposCobranca.find(t => t.valor === tipo)?.unidade || '';
  }

  labelLocalAtendimento(local: string): string {
    return this.locaisAtendimento.find(l => l.valor === local)?.label || local;
  }

  get tipoCobrancaAtual(): string {
    return this.form.get('tipoCobranca')?.value || 'FIXO';
  }

  get isPercentual(): boolean { return this.tipoCobrancaAtual === 'PERCENTUAL'; }
  get isFixo(): boolean { return this.tipoCobrancaAtual === 'FIXO'; }

  classeStatus(s: string) {
    return s === 'ATIVO' ? 'badge-success' : 'badge-gray';
  }

  classeLocal(l: string) {
    return ({ NO_LOCAL: 'badge-info', DOMICILIO: 'badge-warning', AMBOS: 'badge-success' } as any)[l] || 'badge-gray';
  }

  iconLocal(l: string) {
    return ({ NO_LOCAL: 'fa-store', DOMICILIO: 'fa-home', AMBOS: 'fa-exchange-alt' } as any)[l] || 'fa-map-marker';
  }

  abrirModal() {
    this.modoEdicao = false;
    this.servicoEditandoId = null;
    this.form.reset({
      statusServico: 'ATIVO', statusExecucaoServico: 'PENDENTE',
      tempoBuffer: 0, tipoCobranca: 'FIXO', localAtendimento: 'NO_LOCAL'
    });
    this.modalAberto = true;
  }

  abrirModalEdicao(s: Servico) {
    this.modoEdicao = true;
    this.servicoEditandoId = s.id ?? null;
    this.form.patchValue({
      nome: s.nome, descricao: s.descricao,
      duracaoMinutos: s.duracaoMinutos, tempoBuffer: s.tempoBuffer ?? 0,
      tipoCobranca: s.tipoCobranca || 'FIXO',
      valorServico: s.valorServico, localAtendimento: s.localAtendimento || 'NO_LOCAL',
      profissionalId: s.profissionalId,
      statusServico: s.statusServico || 'ATIVO',
      statusExecucaoServico: s.statusExecucaoServico || 'PENDENTE'
    });
    this.modalAberto = true;
  }

  fecharModal() { this.modalAberto = false; }

  salvar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.salvando = true;
    const payload = {
      ...this.form.value,
      duracaoMinutos: Number(this.form.value.duracaoMinutos),
      valor:          Number(this.form.value.valor),
      profissionalId: Number(this.form.value.profissionalId)
    };

    const operacao = this.modoEdicao && this.servicoEditandoId
      ? this.servicoService.atualizar(this.servicoEditandoId, payload)
      : this.servicoService.cadastrar(payload);

    operacao.subscribe({
      next: () => {
        this.toast.sucesso(this.modoEdicao ? 'Serviço atualizado!' : 'Serviço cadastrado!');
        this.fecharModal(); this.carregarServicos(); this.salvando = false;
      },
      error: (err: any) => { this.toast.erro(err.mensagemAmigavel || 'Erro ao salvar.'); this.salvando = false; }
    });
  }
}
