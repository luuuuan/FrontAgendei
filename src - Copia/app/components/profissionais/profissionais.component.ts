import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProfissionalService } from '../../services/profissional.service';
import { UsuarioService } from '../../services/usuario.service';
import { ServicoService } from '../../services/servico.service';
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
  erroBuscaUsuario = '';

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private profissionalService: ProfissionalService,
    private usuarioService: UsuarioService,
    private servicoService: ServicoService,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      usuarioId: ['', Validators.required],
      descricao: [''],
      comissaoPercentual: [0, [Validators.min(0), Validators.max(100)]],
      statusProfissional: ['ATIVO'],
      servicosIds: [[]]
    });
  }

  ngOnInit() {
    this.carregarProfissionais();
    this.servicoService.listar().subscribe({ next: l => this.servicos = l, error: () => {} });
  }

  carregarProfissionais() {
    this.carregando = true; this.erro = '';
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
    this.form.reset({ statusProfissional: 'ATIVO', comissaoPercentual: 0, servicosIds: [] });
    this.buscaUsuario = '';
    this.usuarioEncontrado = null;
    this.erroBuscaUsuario = '';
    this.modalAberto = true;
  }

  fecharModal() { this.modalAberto = false; }

  buscarUsuario() {
    const valor = this.buscaUsuario.trim();
    if (!valor) { this.erroBuscaUsuario = 'Informe um CPF ou e-mail.'; return; }
    this.buscandoUsuario = true;
    this.usuarioEncontrado = null;
    this.erroBuscaUsuario = '';

    this.usuarioService.buscarPorCpfOuEmail(valor).subscribe({
      next: (usuario) => {
        this.usuarioEncontrado = usuario;
        this.form.patchValue({ usuarioId: usuario.id });
        this.buscandoUsuario = false;
      },
      error: () => {
        this.erroBuscaUsuario = 'Usuário não encontrado. Verifique o CPF ou e-mail informado.';
        this.buscandoUsuario = false;
        // Fallback: busca na lista local
        this.usuarioService.listar().subscribe({
          next: (lista) => {
            const cpfLimpo = valor.replace(/\D/g, '');
            const u = lista.find(u =>
              u.email?.toLowerCase() === valor.toLowerCase() ||
              u.cpf?.replace(/\D/g, '') === cpfLimpo
            );
            if (u) {
              this.usuarioEncontrado = u;
              this.form.patchValue({ usuarioId: u.id });
              this.erroBuscaUsuario = '';
            }
          },
          error: () => {}
        });
      }
    });
  }

  salvar() {
    if (!this.usuarioEncontrado) { this.toast.aviso('Busque e selecione um usuário primeiro.'); return; }
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.salvando = true;
    const payload = {
      ...this.form.value,
      usuarioId: Number(this.form.value.usuarioId),
      comissaoPercentual: Number(this.form.value.comissaoPercentual)
    };
    this.profissionalService.cadastrar(payload).subscribe({
      next: () => { this.toast.sucesso('Profissional cadastrado!'); this.fecharModal(); this.carregarProfissionais(); this.salvando = false; },
      error: (err: any) => { this.toast.erro(err.mensagemAmigavel || 'Erro ao cadastrar.'); this.salvando = false; }
    });
  }

  iniciais(nome: string | undefined) {
    if (!nome) return '?';
    const p = nome.trim().split(' ');
    return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length-1][0]).toUpperCase();
  }

  classeStatus(s: string | undefined) { return s === 'ATIVO' ? 'badge-success' : 'badge-gray'; }

  aplicarMascaraCpf(event: any) {
    let v = event.target.value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    event.target.value = v;
    this.buscaUsuario = v;
  }
}
