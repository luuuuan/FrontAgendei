import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AgendamentoService } from '../../services/agendamento.service';
import { ServicoService } from '../../services/servico.service';
import { ProfissionalService } from '../../services/profissional.service';
import { UsuarioService } from '../../services/usuario.service';
import { ToastService } from '../../services/toast.service';
import { AgendamentoResponse, Servico, Profissional, Usuario, EnderecoAgendamento } from '../../models/models';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { AvaliacaoService } from '../../services/avaliacao.service';

@Component({
  selector: 'app-area-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SkeletonComponent],
  templateUrl: './area-cliente.component.html',
  styleUrls: ['./area-cliente.component.css']
})
export class AreaClienteComponent implements OnInit {

  usuarioLogado: Usuario | null = null;
  iniciaisUsuario = 'CL';

  // Dados
  agendamentosHoje: AgendamentoResponse[] = [];
  todoAgendamentos: AgendamentoResponse[] = [];
  servicos: Servico[] = [];
  profissionais: Profissional[] = [];

  carregandoAgendamentos = false;
  carregandoHistorico = false;
  carregandoServicos = false;
  carregandoProfissionais = false;
  carregandoInicial = true;

  telaAtiva: 'dashboard' | 'novo-agendamento' | 'historico' | 'perfil' = 'dashboard';

  get totalConfirmados() { return this.agendamentosHoje.filter(a => a.statusAgendamento === 'CONFIRMADO').length; }
  get totalPendentes() { return this.agendamentosHoje.filter(a => a.statusAgendamento === 'PENDENTE').length; }

  // Fix 6: servicos e profissionais CONTRATADOS pelo cliente
  get servicosContratados(): Servico[] {
    const ids = new Set(this.todoAgendamentos.flatMap(a => a.servicoId ?? []));
    return this.servicos.filter(s => s.id && ids.has(s.id));
  }
  get profissionaisContratados(): Profissional[] {
    const ids = new Set(this.todoAgendamentos.map(a => a.profissionalId).filter(Boolean));
    return this.profissionais.filter(p => p.id && ids.has(p.id));
  }

  stepAgendamento = 1;
  termoBusca = '';
  servicosFiltrados: any[] = [];
  servicoSelecionado: Servico | null = null; // mantido para compatibilidade
  servicosSelecionados: Servico[] = [];
  profissionalSelecionado: Profissional | null = null;
  dataSelecionada = '';
  horaSelecionada = '';
  observacoes = '';
  salvandoAgendamento = false;
  quantidadeServico = 1; // para cobranças variáveis (m², horas, etc.)
  dataMinima = new Date().toISOString().split('T')[0];
  horariosDisponiveis: string[] = [];
  carregandoHorarios = false;
  mensagemDisponibilidade = '';

  // Domicilio
  enderecoAgendamento: EnderecoAgendamento | null = null;
  modalEnderecoAberto = false;
  buscandoCep = false;
  enderecoTemp: EnderecoAgendamento = { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '' };

  get tiposVariaveis(): string[] {
    return ['HORA', 'METRO_QUADRADO', 'METRO_LINEAR', 'UNIDADE', 'DIARIA'];
  }

  get servicoTemCobrancaVariavel(): boolean {
    return this.servicosSelecionados.some(s => this.tiposVariaveis.includes(s.tipoCobranca || ''));
  }

  get valorTotalCalculado(): number {
    return this.servicosSelecionados.reduce((acc, s) => {
      const tipo = s.tipoCobranca || 'FIXO';
      if (this.tiposVariaveis.includes(tipo)) return acc + (s.valorServico ?? s.valor ?? 0) * this.quantidadeServico;
      return acc + (s.valorServico ?? s.valor ?? 0);
    }, 0);
  }

  labelUnidade(tipo: string): string {
    return ({ HORA: 'horas', METRO_QUADRADO: 'm²', METRO_LINEAR: 'metros', UNIDADE: 'unidades', DIARIA: 'dias' } as any)[tipo] || '';
  }

  get profissionalAtendeADomicilio(): boolean {
    return this.profissionalSelecionado?.atendeADomicilio === true;
  }

  get enderecoExibicao(): string {
    const e = this.enderecoAgendamento;
    if (e && e.logradouro) {
      return e.logradouro + ', ' + e.numero + ' - ' + e.bairro + ', ' + e.cidade + '/' + e.estado;
    }
    const u = this.usuarioLogado;
    return u?.enderecoId ? 'Endereco cadastrado (ID: ' + u.enderecoId + ')' : 'Endereco do cliente';
  }

  dataAtual = new Date();
  diasDoMes: (number | null)[] = [];
  mesLabel = '';
  diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  // Detalhe agendamento
  agendamentoDetalhes: AgendamentoResponse | null = null;
  modalDetalhesAberto = false;

  // UC017 — Avaliacao
  modalAvaliacaoAberto = false;
  agendamentoParaAvaliar: AgendamentoResponse | null = null;
  notaAvaliacao = 0;
  comentarioAvaliacao = '';
  enviandoAvaliacao = false;

  // UC003 — Cancelar/Reagendar
  modalCancelarAberto = false;
  modalReagendar = false;
  cancelando = false;
  reagendando = false;
  motivoCancelamento = '';
  // horarios disponiveis para reagendamento
  horariosReagendamento: string[] = [];
  carregandoHorariosReagendamento = false;
  dataSelecionadaReagendamento = '';
  horaSelecionadaReagendamento = '';

  // Perfil
  formPerfil: FormGroup;
  formSenha: FormGroup;
  salvandoPerfil = false;
  salvandoSenha = false;
  abaPerfilAtiva: 'dados' | 'senha' = 'dados';

  // Filtro historico
  filtroHistorico: 'todos' | 'CONFIRMADO' | 'PENDENTE' | 'CANCELADO' = 'todos';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private agendamentoService: AgendamentoService,
    private servicoService: ServicoService,
    private profissionalService: ProfissionalService,
    private usuarioService: UsuarioService,
    private toast: ToastService,
    private router: Router,
    private avaliacaoService: AvaliacaoService
  ) {
    this.formPerfil = this.fb.group({
      nome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', [Validators.required, Validators.minLength(10)]],
      cpf: ['', [Validators.required, Validators.minLength(11)]],
      dataNascimento: ['']
    });

    this.formSenha = this.fb.group({
      senhaAtual: ['', Validators.required],
      novaSenha: ['', [Validators.required, Validators.minLength(8)]],
      confirmarSenha: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.carregarDadosUsuario();
    this.carregarAgendamentosHoje();
    this.carregarServicos();
    this.carregarProfissionais();
    this.gerarCalendario();
  }

  carregarDadosUsuario() {
    const sessao = this.authService.getSessao();
    if (!sessao) return;
    this.usuarioService.buscarPorId(sessao.usuarioId).subscribe({
      next: (usuario) => {
        this.usuarioLogado = usuario;
        this.iniciaisUsuario = this.gerarIniciais(usuario.nome);
        this.formPerfil.patchValue({
          nome: usuario.nome,
          email: usuario.email,
          telefone: usuario.telefone,
          cpf: usuario.cpf,
          dataNascimento: usuario.dataNascimento || ''
        });
      },
      error: () => {}
    });
  }

  carregarAgendamentosHoje() {
    this.carregandoAgendamentos = true;
    const sessao = this.authService.getSessao();
    if (!sessao) { this.carregandoAgendamentos = false; return; }
    this.agendamentoService.buscarPorUsuario(sessao.usuarioId).subscribe({
      next: (lista) => {
        const hoje = new Date().toISOString().split('T')[0];
        this.agendamentosHoje = lista.filter(a => a.dataAgendamento?.startsWith(hoje));
        this.todoAgendamentos = lista;
        this.carregandoAgendamentos = false;
        this.verificarInicial();
      },
      error: () => {
        const hoje = new Date().toISOString().split('T')[0];
        this.agendamentoService.buscarPorData(hoje).subscribe({
          next: (lista) => {
            this.agendamentosHoje = lista.filter(a => a.usuarioId === sessao.usuarioId);
            this.carregandoAgendamentos = false;
          },
          error: () => { this.carregandoAgendamentos = false; }
        });
      }
    });
  }

  carregarHistorico() {
    this.carregandoHistorico = true;
    const sessao = this.authService.getSessao();
    if (!sessao) { this.carregandoHistorico = false; return; }
    this.agendamentoService.buscarPorUsuario(sessao.usuarioId).subscribe({
      next: (lista) => { this.todoAgendamentos = lista; this.carregandoHistorico = false; },
      error: () => {
        this.agendamentoService.buscarTodos().subscribe({
          next: (lista) => {
            this.todoAgendamentos = lista.filter(a => a.usuarioId === sessao.usuarioId);
            this.carregandoHistorico = false;
          },
          error: () => { this.carregandoHistorico = false; }
        });
      }
    });
  }

  get agendamentosFiltrados(): AgendamentoResponse[] {
    if (this.filtroHistorico === 'todos') return this.todoAgendamentos;
    return this.todoAgendamentos.filter(a => a.statusAgendamento === this.filtroHistorico);
  }

  carregarServicos() {
    this.carregandoServicos = true;
    this.servicoService.listar().subscribe({
      next: (lista) => { this.servicos = lista; this.servicosFiltrados = lista; this.carregandoServicos = false; this.verificarInicial(); },
      error: () => { this.carregandoServicos = false; this.verificarInicial(); }
    });
  }

  carregarProfissionais() {
    this.carregandoProfissionais = true;
    this.profissionalService.listarTodos().subscribe({
      next: (lista) => { this.profissionais = lista; this.carregandoProfissionais = false; this.verificarInicial(); },
      error: () => { this.carregandoProfissionais = false; this.verificarInicial(); }
    });
  }

  verificarInicial() {
    if (!this.carregandoAgendamentos && !this.carregandoServicos && !this.carregandoProfissionais) {
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

  mesAnterior() {
    const novaData = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth() - 1, 1);
    const hoje = new Date(); hoje.setDate(1); hoje.setHours(0, 0, 0, 0);
    if (novaData < hoje) return;
    this.dataAtual = novaData;
    this.gerarCalendario();
  }

  mesSeguinte() {
    this.dataAtual = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth() + 1, 1);
    this.gerarCalendario();
  }

  selecionarDia(dia: number | null) {
    if (!dia) return;
    const ano = this.dataAtual.getFullYear(), mes = this.dataAtual.getMonth() + 1;
    const data = ano + '-' + String(mes).padStart(2, '0') + '-' + String(dia).padStart(2, '0');
    const hoje = new Date().toISOString().split('T')[0];
    if (data < hoje) { this.toast.aviso('Nao e possivel agendar para datas passadas.'); return; }
    this.dataSelecionada = data;
    this.horaSelecionada = '';
    this.horariosDisponiveis = [];
    this.mensagemDisponibilidade = '';
    this.carregarHorariosDisponiveis(); // sempre tenta buscar ao selecionar dia
  }

  carregarHorariosDisponiveis() {
    if (!this.dataSelecionada) return;
    if (!this.servicoSelecionado?.id && this.servicosSelecionados.length === 0) return;
    this.carregandoHorarios = true;
    this.horariosDisponiveis = [];
    this.mensagemDisponibilidade = '';
    const sid = this.servicosSelecionados[0]?.id || this.servicoSelecionado?.id;
    this.agendamentoService.buscarHorariosDisponiveis(
      this.dataSelecionada,
      sid
    ).subscribe({
      next: (horarios) => {
        this.horariosDisponiveis = horarios;
        this.carregandoHorarios = false;
        this.mensagemDisponibilidade = horarios.length === 0
          ? 'Nenhum horario disponivel nessa data.'
          : horarios.length + ' horario(s) disponivel(is)';
      },
      error: () => { this.carregandoHorarios = false; }
    });
  }

  ehHoje(dia: number | null): boolean {
    if (!dia) return false;
    const hoje = new Date();
    return dia === hoje.getDate() && this.dataAtual.getMonth() === hoje.getMonth() && this.dataAtual.getFullYear() === hoje.getFullYear();
  }

  ehPassado(dia: number | null): boolean {
    if (!dia) return false;
    const dataCell = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth(), dia);
    dataCell.setHours(0, 0, 0, 0);
    const hojeZero = new Date(); hojeZero.setHours(0, 0, 0, 0);
    return dataCell < hojeZero;
  }

  ehSelecionado(dia: number | null): boolean {
    if (!dia || !this.dataSelecionada) return false;
    const ano = this.dataAtual.getFullYear(), mes = this.dataAtual.getMonth() + 1;
    const data = ano + '-' + String(mes).padStart(2, '0') + '-' + String(dia).padStart(2, '0');
    return data === this.dataSelecionada;
  }

  iniciarAgendamento() {
    this.stepAgendamento = 1;
    this.servicoSelecionado = null;
    this.servicosSelecionados = [];
    this.profissionalSelecionado = null;
    this.termoBusca = '';
    this.servicosFiltrados = [...this.servicos];
    this.dataSelecionada = '';
    this.horaSelecionada = '';
    this.observacoes = '';
    this.enderecoAgendamento = null;
    this.quantidadeServico = 1;
    this.dataAtual = new Date();
    this.gerarCalendario();
    this.telaAtiva = 'novo-agendamento';
  }

  // Multi-seleção de serviços
  toggleServico(s: Servico) {
    const idx = this.servicosSelecionados.findIndex(x => x.id === s.id);
    if (idx >= 0) {
      this.servicosSelecionados.splice(idx, 1);
    } else {
      this.servicosSelecionados.push(s);
    }
  }

  isServicoSelecionado(s: Servico): boolean {
    return this.servicosSelecionados.some(x => x.id === s.id);
  }

  get valorTotalServicos(): number {
    return this.servicosSelecionados.reduce((acc, s) => acc + (s.valorServico ?? s.valor ?? 0), 0);
  }

  get duracaoTotalServicos(): number {
    return this.servicosSelecionados.reduce((acc, s) => acc + s.duracaoMinutos + (s.tempoBuffer || 0), 0);
  }

  confirmarServicos() {
    if (this.servicosSelecionados.length === 0) { this.toast.aviso('Selecione ao menos um servico.'); return; }
    this.servicoSelecionado = this.servicosSelecionados[0];

    if (this.servicoSelecionado.profissionalId) {
      // Serviço tem profissional vinculado — busca e seta automaticamente
      this.profissionalService.listarPorServico(this.servicoSelecionado.id!).subscribe({
        next: (lista) => {
          if (lista.length > 0) {
            this.profissionalSelecionado = lista[0];
            if (!this.profissionalSelecionado.atendeADomicilio) {
              this.enderecoAgendamento = null;
            }
          }
          this.profissionais = lista;
        },
        error: () => {}
      });
    } else {
      // Serviço sem profissional — o próprio prestador executa
      this.profissionalSelecionado = null;
    }
    this.stepAgendamento = 3; // pula o step 2
  }

  filtrarServicos() {
    const t = this.termoBusca.toLowerCase().trim();
    this.servicosFiltrados = t
      ? this.servicos.filter(s =>
          s.nome?.toLowerCase().includes(t) ||
          s.descricao?.toLowerCase().includes(t) ||
          (s.nomeProfissional || '').toLowerCase().includes(t) ||
          (s.nomePrestador || '').toLowerCase().includes(t)
        )
      : this.servicos;
  }

  selecionarServico(s: Servico) {
    this.servicoSelecionado = s;
    this.profissionais = [];
    this.profissionalService.listarPorServico(s.id!).subscribe({
      next: (lista) => this.profissionais = lista,
      error: () => {}
    });
    this.stepAgendamento = 2;
  }

  selecionarProfissional(p: Profissional) {
    this.profissionalSelecionado = p;
    if (!p.atendeADomicilio) { this.enderecoAgendamento = null; }
    this.stepAgendamento = 3;
  }

  confirmarDataHora() {
    if (!this.dataSelecionada || !this.horaSelecionada) { this.toast.aviso('Selecione a data e o horario.'); return; }
    const hoje = new Date().toISOString().split('T')[0];
    if (this.dataSelecionada < hoje) { this.toast.erro('Nao e possivel agendar para datas passadas.'); return; }
    this.stepAgendamento = 4;
  }

  confirmarAgendamento() {
    const sessao = this.authService.getSessao();
    if (!sessao || !this.servicoSelecionado || !this.profissionalSelecionado || !this.dataSelecionada || !this.horaSelecionada) {
      this.toast.erro('Preencha todos os dados do agendamento.');
      return;
    }
    const hoje = new Date().toISOString().split('T')[0];
    if (this.dataSelecionada < hoje) { this.toast.erro('Nao e possivel agendar para datas passadas.'); return; }

    this.salvandoAgendamento = true;
    this.agendamentoService.criar({
      dataAgendamento: this.dataSelecionada,
      dataCriacao: new Date().toISOString(),
      horaInicio: this.horaSelecionada,
      statusAgendamento: 'PENDENTE',
      taxaPlataforma: this.servicoSelecionado.valor * 0.1,
      valorTotal: this.servicoSelecionado.valor,
      observacoes: this.observacoes,
      usuarioId: sessao.usuarioId,
      profissionalId: this.profissionalSelecionado?.id,  // nullable quando prestador executa
      servicos: this.servicosSelecionados.length > 0 ? this.servicosSelecionados.map(s => s.id!) : [this.servicoSelecionado!.id!],
      enderecoId: this.usuarioLogado?.enderecoId
    } as any).subscribe({
      next: (ag) => {
        this.toast.sucesso('Agendamento realizado com sucesso!');
        this.telaAtiva = 'historico';
        this.carregarHistorico();
        this.carregarAgendamentosHoje();
        this.salvandoAgendamento = false;
        this.agendamentoDetalhes = ag;
        this.modalDetalhesAberto = true;
      },
      error: (err: any) => {
        this.toast.erro(err.mensagemAmigavel || 'Erro ao agendar.');
        this.salvandoAgendamento = false;
      }
    });
  }

  verDetalhes(ag: AgendamentoResponse) { this.agendamentoDetalhes = ag; this.modalDetalhesAberto = true; }
  fecharDetalhes() { this.modalDetalhesAberto = false; this.agendamentoDetalhes = null; }
  mudarTelaHistorico() { this.telaAtiva = 'historico'; if (this.todoAgendamentos.length === 0) this.carregarHistorico(); }

  // Modal endereco agendamento (domicilio)
  abrirModalEndereco() {
    const e = this.enderecoAgendamento;
    this.enderecoTemp = e ? { ...e } : { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' };
    this.modalEnderecoAberto = true;
  }

  fecharModalEndereco() { this.modalEnderecoAberto = false; }

  confirmarNovoEndereco() {
    const e = this.enderecoTemp;
    if (!e.cep || !e.logradouro || !e.numero || !e.bairro || !e.cidade || !e.estado) {
      this.toast.aviso('Preencha todos os campos do endereco.');
      return;
    }
    this.enderecoAgendamento = { ...e };
    this.modalEnderecoAberto = false;
    this.toast.sucesso('Endereco atualizado para este agendamento.');
  }

  buscarCepAgendamento() {
    const cep = this.enderecoTemp.cep.replace(/\D/g, '');
    if (cep.length !== 8) { this.toast.erro('CEP invalido.'); return; }
    this.buscandoCep = true;
    fetch('https://viacep.com.br/ws/' + cep + '/json/')
      .then(r => r.json())
      .then((data: any) => {
        if (data.erro) {
          this.toast.erro('CEP nao encontrado.');
        } else {
          this.enderecoTemp.logradouro = data.logradouro;
          this.enderecoTemp.bairro     = data.bairro;
          this.enderecoTemp.cidade     = data.localidade;
          this.enderecoTemp.estado     = data.uf;
          this.toast.sucesso('Endereco preenchido!');
        }
        this.buscandoCep = false;
      })
      .catch(() => { this.toast.erro('Erro ao buscar CEP.'); this.buscandoCep = false; });
  }

  aplicarMascaraCepAgendamento(event: any) {
    let v = event.target.value.replace(/\D/g, '').slice(0, 8);
    v = v.replace(/(\d{5})(\d{0,3})/, '$1-$2');
    event.target.value = v;
    this.enderecoTemp.cep = v;
  }

  // Perfil
  salvarPerfil() {
    if (this.formPerfil.invalid) { this.formPerfil.markAllAsTouched(); return; }
    const sessao = this.authService.getSessao();
    if (!sessao || !this.usuarioLogado?.id) { this.toast.erro('Sessao invalida.'); return; }
    this.salvandoPerfil = true;
    const v = this.formPerfil.value;
    this.usuarioService.atualizar(this.usuarioLogado.id, {
      nome: v.nome,
      email: v.email,
      telefone: v.telefone.replace(/\D/g, ''),
      cpf: v.cpf.replace(/\D/g, ''),
      dataNascimento: v.dataNascimento || undefined
    }).subscribe({
      next: (usuario) => {
        this.usuarioLogado = { ...this.usuarioLogado!, ...usuario };
        this.iniciaisUsuario = this.gerarIniciais(usuario.nome);
        this.toast.sucesso('Dados atualizados com sucesso!');
        this.salvandoPerfil = false;
      },
      error: (err: any) => {
        this.toast.erro(err.mensagemAmigavel || 'Erro ao atualizar dados.');
        this.salvandoPerfil = false;
      }
    });
  }

  salvarSenha() {
    const v = this.formSenha.value;
    if (this.formSenha.invalid) { this.formSenha.markAllAsTouched(); return; }
    if (v.novaSenha !== v.confirmarSenha) { this.toast.erro('As senhas nao coincidem.'); return; }
    const sessao = this.authService.getSessao();
    if (!sessao || !this.usuarioLogado?.id) { this.toast.erro('Sessao invalida.'); return; }
    this.salvandoSenha = true;
    this.usuarioService.trocarSenha(this.usuarioLogado.id, v.senhaAtual, v.novaSenha).subscribe({
      next: () => { this.toast.sucesso('Senha alterada com sucesso!'); this.formSenha.reset(); this.salvandoSenha = false; },
      error: (err: any) => { this.toast.erro(err.mensagemAmigavel || 'Senha atual incorreta.'); this.salvandoSenha = false; }
    });
  }

  // UC003 — Cancelar agendamento
  podeCancelar(ag: AgendamentoResponse): boolean {
    if (!ag.dataAgendamento || !ag.horaInicio) return false;
    if (['CANCELADO', 'REALIZADO', 'AUSENTE'].includes(ag.statusAgendamento)) return false;
    const dataHora = new Date(ag.dataAgendamento + 'T' + ag.horaInicio);
    const agora = new Date();
    const diffMs = dataHora.getTime() - agora.getTime();
    const diffHoras = diffMs / (1000 * 60 * 60);
    return diffHoras >= 2; // RN-07: pode cancelar até 2h antes
  }

  abrirModalCancelar(ag: AgendamentoResponse) {
    this.agendamentoDetalhes = ag;
    this.motivoCancelamento = '';
    this.modalCancelarAberto = true;
    this.modalDetalhesAberto = false;
  }

  fecharModalCancelar() { this.modalCancelarAberto = false; }

  confirmarCancelamento() {
    if (!this.agendamentoDetalhes) return;
    this.cancelando = true;
    this.agendamentoService.atualizarStatus(this.agendamentoDetalhes.id!, 'CANCELADO').subscribe({
      next: () => {
        this.toast.sucesso('Agendamento cancelado com sucesso.');
        this.fecharModalCancelar();
        this.carregarHistorico();
        this.carregarAgendamentosHoje();
        this.cancelando = false;
      },
      error: (err: any) => {
        this.toast.erro(err.mensagemAmigavel || 'Erro ao cancelar agendamento.');
        this.cancelando = false;
      }
    });
  }

  // UC003 — Reagendar
  abrirModalReagendar(ag: AgendamentoResponse) {
    this.agendamentoDetalhes = ag;
    this.dataSelecionadaReagendamento = '';
    this.horaSelecionadaReagendamento = '';
    this.horariosReagendamento = [];
    this.modalReagendar = true;
    this.modalDetalhesAberto = false;
  }

  fecharModalReagendar() { this.modalReagendar = false; }

  buscarHorariosReagendamento() {
    if (!this.dataSelecionadaReagendamento || !this.agendamentoDetalhes?.profissionalId) return;
    const hoje = new Date().toISOString().split('T')[0];
    if (this.dataSelecionadaReagendamento < hoje) {
      this.toast.aviso('Selecione uma data futura.');
      return;
    }
    this.carregandoHorariosReagendamento = true;
    this.horaSelecionadaReagendamento = '';
    const sid = this.agendamentoDetalhes?.servicoId?.[0];
    this.agendamentoService.buscarHorariosDisponiveis(
      this.dataSelecionadaReagendamento,
      sid
    ).subscribe({
      next: h => { this.horariosReagendamento = h; this.carregandoHorariosReagendamento = false; },
      error: () => { this.horariosReagendamento = []; this.carregandoHorariosReagendamento = false; }
    });
  }

  confirmarReagendamento() {
    if (!this.agendamentoDetalhes || !this.dataSelecionadaReagendamento || !this.horaSelecionadaReagendamento) {
      this.toast.aviso('Selecione a data e o horario.');
      return;
    }
    this.reagendando = true;
    const sessao = this.authService.getSessao();
    // 1. Cancela o agendamento original
    this.agendamentoService.atualizarStatus(this.agendamentoDetalhes.id!, 'CANCELADO').subscribe({
      next: () => {
        // 2. Cria novo agendamento com nova data/hora
        this.agendamentoService.criar({
          dataAgendamento: this.dataSelecionadaReagendamento,
          horaInicio: this.horaSelecionadaReagendamento,
          statusAgendamento: 'PENDENTE',
          usuarioId: sessao?.usuarioId,
          profissionalId: this.agendamentoDetalhes!.profissionalId,
          servicos: this.agendamentoDetalhes!.servicoId,
          valorTotal: this.agendamentoDetalhes!.valorTotal,
          taxaPlataforma: 0,
          observacoes: 'Reagendado de ' + this.formatarData(this.agendamentoDetalhes!.dataAgendamento)
        } as any).subscribe({
          next: () => {
            this.toast.sucesso('Reagendamento realizado com sucesso!');
            this.fecharModalReagendar();
            this.carregarHistorico();
            this.carregarAgendamentosHoje();
            this.reagendando = false;
          },
          error: (err: any) => {
            this.toast.erro(err.mensagemAmigavel || 'Erro ao criar novo agendamento.');
            this.reagendando = false;
          }
        });
      },
      error: (err: any) => {
        this.toast.erro(err.mensagemAmigavel || 'Erro ao cancelar agendamento original.');
        this.reagendando = false;
      }
    });
  }

  // UC017 — Avaliar prestador
  podeAvaliar(ag: AgendamentoResponse): boolean {
    return ag.statusAgendamento === 'REALIZADO';
  }

  abrirModalAvaliacao(ag: AgendamentoResponse) {
    this.agendamentoParaAvaliar = ag;
    this.notaAvaliacao = 0;
    this.comentarioAvaliacao = '';
    this.modalAvaliacaoAberto = true;
    this.modalDetalhesAberto = false;
  }

  fecharModalAvaliacao() { this.modalAvaliacaoAberto = false; this.agendamentoParaAvaliar = null; }

  definirNota(n: number) { this.notaAvaliacao = n; }

  enviarAvaliacao() {
    if (this.notaAvaliacao === 0) { this.toast.aviso('Selecione uma nota de 1 a 5 estrelas.'); return; }
    if (!this.agendamentoParaAvaliar) return;
    const sessao = this.authService.getSessao();
    this.enviandoAvaliacao = true;
    this.avaliacaoService.cadastrar({
      nota: this.notaAvaliacao,
      comentario: this.comentarioAvaliacao,
      agendamentoId: this.agendamentoParaAvaliar.id,
      profissionalId: this.agendamentoParaAvaliar.profissionalId,
      usuarioId: sessao?.usuarioId
    }).subscribe({
      next: () => {
        this.toast.sucesso('Avaliacao enviada com sucesso!');
        this.fecharModalAvaliacao();
        this.enviandoAvaliacao = false;
      },
      error: (err: any) => {
        this.toast.erro(err.mensagemAmigavel || 'Erro ao enviar avaliacao.');
        this.enviandoAvaliacao = false;
      }
    });
  }

  sair() { this.authService.logout(); this.router.navigate(['/login']); }

  gerarIniciais(nome: string): string {
    if (!nome) return 'CL';
    const p = nome.trim().split(' ');
    return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
  }

  nomeProfissional(id: number | undefined): string {
    if (!id) {
      // sem profissional — mostra o nome do prestador
      const sessao = this.authService.getSessao();
      return sessao?.nomeEmpresa || 'Prestador';
    }
    const p = this.profissionais.find(p => p.id === id);
    return p?.nome || 'Profissional #' + id;
  }

  nomeServico(id: number): string {
    const s = this.servicos.find(s => s.id === id);
    return s?.nome || 'Servico #' + id;
  }

  labelStatus(s: string) { return ({ CONFIRMADO: 'Confirmado', PENDENTE: 'Pendente', CANCELADO: 'Cancelado' } as any)[s] || s; }
  classeStatus(s: string) { return ({ CONFIRMADO: 'badge-success', PENDENTE: 'badge-warning', CANCELADO: 'badge-danger' } as any)[s] || 'badge-gray'; }
  formatarDataHora(v: string) { return v ? new Date(v).toLocaleString('pt-BR') : '-'; }
  formatarData(v: string) {
    if (!v) return '-';
    const data = v.includes('T') ? new Date(v) : new Date(v + 'T00:00:00');
    return data.toLocaleDateString('pt-BR');
  }
  primeiroNome(nome: string | undefined) { return nome?.split(' ')[0] || 'Cliente'; }

  aplicarMascaraTelefone(event: any) {
    let v = event.target.value.replace(/\D/g, '').slice(0, 11);
    if (v.length <= 10) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    else v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    event.target.value = v;
    this.formPerfil.get('telefone')?.setValue(v, { emitEvent: false });
  }

  aplicarMascaraCpf(event: any) {
    let v = event.target.value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    event.target.value = v;
    this.formPerfil.get('cpf')?.setValue(v, { emitEvent: false });
  }
}
