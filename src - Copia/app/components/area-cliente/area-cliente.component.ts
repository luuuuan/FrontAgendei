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
import { AgendamentoResponse, Servico, Profissional, Usuario } from '../../models/models';

@Component({
  selector: 'app-area-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './area-cliente.component.html',
  styleUrls: ['./area-cliente.component.css']
})
export class AreaClienteComponent implements OnInit {

  usuarioLogado: Usuario | null = null;
  iniciais = 'CL';

  // Dados
  agendamentosHoje: AgendamentoResponse[] = [];
  todoAgendamentos: AgendamentoResponse[] = [];
  servicos: Servico[] = [];
  profissionais: Profissional[] = [];

  carregandoAgendamentos = false;
  carregandoHistorico = false;
  carregandoServicos = false;

  telaAtiva: 'dashboard' | 'novo-agendamento' | 'historico' | 'perfil' = 'dashboard';

  get totalConfirmados() { return this.agendamentosHoje.filter(a => a.statusAgendamento === 'CONFIRMADO').length; }
  get totalPendentes() { return this.agendamentosHoje.filter(a => a.statusAgendamento === 'PENDENTE').length; }

  stepAgendamento = 1;
  servicoSelecionado: Servico | null = null;
  profissionalSelecionado: Profissional | null = null;
  dataSelecionada = '';
  horaSelecionada = '';
  observacoes = '';
  salvandoAgendamento = false;
  dataMinima = new Date().toISOString().split('T')[0];
  horariosDisponiveis: string[] = [];
  carregandoHorarios = false;
  mensagemDisponibilidade = '';

  dataAtual = new Date();
  diasDoMes: (number | null)[] = [];
  mesLabel = '';
  diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Detalhe agendamento
  agendamentoDetalhes: AgendamentoResponse | null = null;
  modalDetalhesAberto = false;

  // Perfil
  formPerfil: FormGroup;
  formSenha: FormGroup;
  salvandoPerfil = false;
  salvandoSenha = false;
  abaPerfilAtiva: 'dados' | 'senha' = 'dados';

  // Filtro histórico
  filtroHistorico: 'todos' | 'CONFIRMADO' | 'PENDENTE' | 'CANCELADO' = 'todos';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private agendamentoService: AgendamentoService,
    private servicoService: ServicoService,
    private profissionalService: ProfissionalService,
    private usuarioService: UsuarioService,
    private toast: ToastService,
    private router: Router
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
    this.usuarioService.listar().subscribe({
      next: (lista) => {
        const usuario = lista.find(u => u.email === sessao.email);
        if (usuario) {
          this.usuarioLogado = usuario;
          this.iniciais = this.gerarIniciais(usuario.nome);
          this.formPerfil.patchValue({
            nome: usuario.nome,
            email: usuario.email,
            telefone: usuario.telefone,
            cpf: usuario.cpf,
            dataNascimento: usuario.dataNascimento || ''
          });
        }
      },
      error: () => { }
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
      },
      error: () => {
        // Fallback: busca por data
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
      next: (lista) => {
        this.todoAgendamentos = lista;
        this.carregandoHistorico = false;
      },
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
      next: (lista) => { this.servicos = lista; this.carregandoServicos = false; },
      error: () => { this.carregandoServicos = false; }
    });
  }

  carregarProfissionais() {
    this.profissionalService.listar().subscribe({
      next: (lista) => this.profissionais = lista,
      error: () => { }
    });
  }

  // Calendário
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
    if (novaData < hoje) return; // não navega para meses passados
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
    const data = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const hoje = new Date().toISOString().split('T')[0];
    if (data < hoje) {
      this.toast.aviso('Não é possível agendar para datas passadas.');
      return;
    }
    this.dataSelecionada = data;
    this.horaSelecionada = '';
    this.horariosDisponiveis = [];
    this.mensagemDisponibilidade = '';

    if (this.profissionalSelecionado?.id) {
      this.carregarHorariosDisponiveis();
    }
  }
  carregarHorariosDisponiveis() {
  if (!this.profissionalSelecionado?.id || !this.dataSelecionada) return;
  this.carregandoHorarios = true;
  this.horariosDisponiveis = [];
  this.mensagemDisponibilidade = '';

  this.agendamentoService.buscarHorariosDisponiveis(
    this.profissionalSelecionado.id,
    this.dataSelecionada,
  ).subscribe({
    next: (horarios) => {
      this.horariosDisponiveis = horarios;
      this.carregandoHorarios = false;
      if (horarios.length === 0) {
        this.mensagemDisponibilidade = 'Nenhum horário disponível nessa data.';
      } else {
        this.mensagemDisponibilidade = `${horarios.length} horário(s) disponível(is)`;
      }
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
    const hoje = new Date();
    const dataCell = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth(), dia);
    dataCell.setHours(0, 0, 0, 0);
    const hojeZero = new Date(); hojeZero.setHours(0, 0, 0, 0);
    return dataCell < hojeZero;
  }

  ehSelecionado(dia: number | null): boolean {
    if (!dia || !this.dataSelecionada) return false;
    const ano = this.dataAtual.getFullYear(), mes = this.dataAtual.getMonth() + 1;
    const data = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    return data === this.dataSelecionada;
  }

  // Wizard agendamento
  iniciarAgendamento() {
    this.stepAgendamento = 1;
    this.servicoSelecionado = null;
    this.profissionalSelecionado = null;
    this.dataSelecionada = '';
    this.horaSelecionada = '';
    this.observacoes = '';
    this.dataAtual = new Date();
    this.gerarCalendario();
    this.telaAtiva = 'novo-agendamento';
  }

  selecionarServico(s: Servico) {
    this.servicoSelecionado = s;
    this.stepAgendamento = 2;
  }

  selecionarProfissional(p: Profissional) {
    this.profissionalSelecionado = p;
    this.stepAgendamento = 3;
  }

  confirmarDataHora() {
    if (!this.dataSelecionada || !this.horaSelecionada) {
      this.toast.aviso('Selecione a data e o horário.');
      return;
    }
    const hoje = new Date().toISOString().split('T')[0];
    if (this.dataSelecionada < hoje) {
      this.toast.erro('Não é possível agendar para datas passadas.');
      return;
    }
    this.stepAgendamento = 4;
  }

  confirmarAgendamento() {
    const sessao = this.authService.getSessao();
    if (!sessao || !this.servicoSelecionado || !this.profissionalSelecionado || !this.dataSelecionada || !this.horaSelecionada) {
      this.toast.erro('Preencha todos os dados do agendamento.');
      return;
    }
    const hoje = new Date().toISOString().split('T')[0];
    if (this.dataSelecionada < hoje) {
      this.toast.erro('Não é possível agendar para datas passadas.');
      return;
    }

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
      profissionalId: this.profissionalSelecionado.id!,
      servicos: [this.servicoSelecionado.id!],
      enderecoId: this.usuarioLogado?.enderecoId
    } as any).subscribe({
      next: (ag) => {
        this.toast.sucesso('Agendamento realizado com sucesso!');
        this.telaAtiva = 'historico';
        this.carregarHistorico();
        this.carregarAgendamentosHoje();
        this.salvandoAgendamento = false;
        // Exibe detalhes do agendamento criado
        this.agendamentoDetalhes = ag;
        this.modalDetalhesAberto = true;
      },
      error: (err: any) => {
        this.toast.erro(err.mensagemAmigavel || 'Erro ao agendar.');
        this.salvandoAgendamento = false;
      }
    });
  }

  verDetalhes(ag: AgendamentoResponse) {
    this.agendamentoDetalhes = ag;
    this.modalDetalhesAberto = true;
  }

  fecharDetalhes() {
    this.modalDetalhesAberto = false;
    this.agendamentoDetalhes = null;
  }

  mudarTelaHistorico() {
    this.telaAtiva = 'historico';
    if (this.todoAgendamentos.length === 0) this.carregarHistorico();
  }

  // Perfil
  salvarPerfil() {
    if (this.formPerfil.invalid) { this.formPerfil.markAllAsTouched(); return; }
    const sessao = this.authService.getSessao();
    if (!sessao || !this.usuarioLogado?.id) { this.toast.erro('Sessão inválida.'); return; }
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
        this.iniciais = this.gerarIniciais(usuario.nome);
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
    if (v.novaSenha !== v.confirmarSenha) { this.toast.erro('As senhas não coincidem.'); return; }
    const sessao = this.authService.getSessao();
    if (!sessao || !this.usuarioLogado?.id) { this.toast.erro('Sessão inválida.'); return; }
    this.salvandoSenha = true;
    this.usuarioService.trocarSenha(this.usuarioLogado.id, v.senhaAtual, v.novaSenha).subscribe({
      next: () => {
        this.toast.sucesso('Senha alterada com sucesso!');
        this.formSenha.reset();
        this.salvandoSenha = false;
      },
      error: (err: any) => {
        this.toast.erro(err.mensagemAmigavel || 'Senha atual incorreta.');
        this.salvandoSenha = false;
      }
    });
  }

  sair() { this.authService.logout(); this.router.navigate(['/login']); }

  // Helpers
  gerarIniciais(nome: string): string {
    if (!nome) return 'CL';
    const p = nome.trim().split(' ');
    return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
  }

  nomeProfissional(id: number) { const p = this.profissionais.find(p => p.id === id); return p?.nome || `Profissional #${id}`; }
  nomeServico(id: number) { const s = this.servicos.find(s => s.id === id); return s?.nome || `Serviço #${id}`; }
  labelStatus(s: string) { return ({ CONFIRMADO: 'Confirmado', PENDENTE: 'Pendente', CANCELADO: 'Cancelado' } as any)[s] || s; }
  classeStatus(s: string) { return ({ CONFIRMADO: 'badge-success', PENDENTE: 'badge-warning', CANCELADO: 'badge-danger' } as any)[s] || 'badge-gray'; }
  formatarDataHora(v: string) { return v ? new Date(v).toLocaleString('pt-BR') : '-'; }
  formatarData(v: string) {
    if (!v) return '-';
    const data = v.includes('T') ? new Date(v) : new Date(v + 'T00:00:00');
    return data.toLocaleDateString('pt-BR');
  } primeiroNome(nome: string | undefined) { return nome?.split(' ')[0] || 'Cliente'; }

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
