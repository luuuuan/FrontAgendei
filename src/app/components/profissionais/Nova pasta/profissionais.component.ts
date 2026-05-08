import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProfissionalService } from '../../services/profissional.service';
import { UsuarioService } from '../../services/usuario.service';
import { ServicoService } from '../../services/servico.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Profissional, Usuario, Servico } from '../../models/models';

@Component({
  selector: 'app-profissionais',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './profissionais.component.html',
  styleUrls: ['./profissionais.component.css']
})
export class ProfissionaisComponent implements OnInit {
  profissionais: Profissional[] = [];
  profissionaisFiltrados: Profissional[] = [];
  servicos: Servico[] = [];
  carregando = false;
  erro = '';
  modalAberto = false;
  salvando = false;
  termoBusca = '';

  // Busca de usuário por CPF/email
  buscaUsuario = '';
  buscandoUsuario = false;
  usuarioEncontrado: Usuario | null = null;
  profissionalEncontrado: Profissional | null = null;
  erroBuscaUsuario = '';

  // Etapas do modal
  // 'busca' → busca o profissional pelo CPF/email
  // 'confirmar' → mostra os dados e confirma a vinculação
  etapaModal: 'busca' | 'confirmar' = 'busca';

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private profissionalService: ProfissionalService,
    private usuarioService: UsuarioService,
    private servicoService: ServicoService,
    private authService: AuthService,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      descricao: [''],
      comissaoPercentual: [0, [Validators.min(0), Validators.max(100)]]
    });
  }

  ngOnInit() {
    this.carregarProfissionais();
    this.servicoService.listar().subscribe({ next: l => this.servicos = l, error: () => {} });
  }

  carregarProfissionais() {
    this.carregando = true;
    this.erro = '';
    this.profissionalService.listar().subscribe({
      next: l => { this.profissionais = l; this.profissionaisFiltrados = l; this.carregando = false; },
      error: (err: any) => { this.erro = err.mensagemAmigavel || 'Erro ao carregar.'; this.carregando = false; }
    });
  }

  filtrar() {
    const t = this.termoBusca.toLowerCase().trim();
    this.profissionaisFiltrados = t
      ? this.profissionais.filter(p => p.nome?.toLowerCase().includes(t))
      : this.profissionais;
  }

  abrirModal() {
    this.etapaModal = 'busca';
    this.buscaUsuario = '';
    this.usuarioEncontrado = null;
    this.profissionalEncontrado = null;
    this.erroBuscaUsuario = '';
    this.form.reset({ comissaoPercentual: 0, descricao: '' });
    this.modalAberto = true;
  }

  fecharModal() { this.modalAberto = false; }

  buscarUsuario() {
    const valor = this.buscaUsuario.trim();
    if (!valor) { this.erroBuscaUsuario = 'Informe um CPF ou e-mail.'; return; }

    this.buscandoUsuario = true;
    this.usuarioEncontrado = null;
    this.profissionalEncontrado = null;
    this.erroBuscaUsuario = '';

    // Passo 1: busca o usuário pelo CPF/email
    this.usuarioService.buscarPorCpfOuEmail(valor).subscribe({
      next: (usuario) => {
        this.usuarioEncontrado = usuario;

        // Passo 2: busca o profissional vinculado a esse usuário
        this.profissionalService.buscarPorUsuarioId(usuario.id!).subscribe({
          next: (profissional) => {
            this.profissionalEncontrado = profissional;
            this.buscandoUsuario = false;
            this.etapaModal = 'confirmar';
          },
          error: () => {
            this.erroBuscaUsuario = 'Usuário encontrado, mas ainda não tem perfil de profissional cadastrado no sistema.';
            this.buscandoUsuario = false;
          }
        });
      },
      error: (err: any) => {
        const msg = err?.error?.erro || '';
        if (msg.includes('Profissional não encontrado')) {
          this.erroBuscaUsuario = 'Este usuário não está cadastrado como profissional.';
        } else {
          this.erroBuscaUsuario = 'Usuário não encontrado. Verifique o CPF ou e-mail informado.';
        }
        this.buscandoUsuario = false;
      }
    });
  }

  vincular() {
    if (!this.profissionalEncontrado?.id) {
      this.toast.erro('Profissional não identificado.');
      return;
    }

    const sessao = this.authService.getSessao();
    if (!sessao?.prestadorId) {
      this.toast.erro('Sessão inválida. Não foi possível identificar a empresa.');
      return;
    }

    this.salvando = true;
    this.profissionalService.vincular(
      this.profissionalEncontrado.id,
      sessao.prestadorId
    ).subscribe({
      next: () => {
        this.toast.sucesso(`${this.profissionalEncontrado?.nome} vinculado à empresa com sucesso!`);
        this.fecharModal();
        this.carregarProfissionais();
        this.salvando = false;
      },
      error: (err: any) => {
        this.toast.erro(err?.error?.erro || 'Erro ao vincular profissional.');
        this.salvando = false;
      }
    });
  }

  voltarBusca() {
    this.etapaModal = 'busca';
    this.profissionalEncontrado = null;
    this.usuarioEncontrado = null;
    this.erroBuscaUsuario = '';
  }

  iniciais(nome: string | undefined) {
    if (!nome) return '?';
    const p = nome.trim().split(' ');
    return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
  }

  classeStatus(s: string | undefined) {
    return s === 'ATIVO' ? 'badge-success' : 'badge-gray';
  }

  nomeServico(id: number): string {
    return this.servicos.find(s => s.id === id)?.nome || `Serviço #${id}`;
  }

  aplicarMascaraCpf(event: any) {
    let v = event.target.value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    event.target.value = v;
    this.buscaUsuario = v;
  }
}