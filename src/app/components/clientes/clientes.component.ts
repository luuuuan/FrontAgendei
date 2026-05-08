import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Usuario } from '../../models/models';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SkeletonComponent],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css']
})
export class ClientesComponent implements OnInit {
  clientes: Usuario[] = [];
  clientesFiltrados: Usuario[] = [];
  clienteSelecionado: Usuario | null = null;
  carregando = false;
  erro = '';
  modalAberto = false;
  salvando = false;
  termoBusca = '';
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      nome:           ['', Validators.required],
      email:          ['', [Validators.required, Validators.email]],
      cpf:            ['', Validators.required],
      telefone:       ['', [Validators.required, Validators.minLength(10)]],
      senha:          ['', [Validators.required, Validators.minLength(8)]],
      dataNascimento: [''],
      enderecoId:     [1],
      tipoUsuario:    ['CLIENTE', Validators.required]
    });
  }

  ngOnInit() { this.carregarClientes(); }

  carregarClientes() {
    this.carregando = true;
    this.erro = '';
    const sessao = this.authService.getSessao();
    // Busca clientes filtrados pelo prestador da sessão
    this.usuarioService.listarClientesPorPrestador(sessao?.prestadorId).subscribe({
      next: l => { this.clientes = l; this.clientesFiltrados = l; this.carregando = false; },
      error: (err: any) => { this.erro = err.mensagemAmigavel || 'Erro ao carregar.'; this.carregando = false; }
    });
  }

  filtrar() {
    const t = this.termoBusca.toLowerCase().trim();
    this.clientesFiltrados = t
      ? this.clientes.filter(c =>
          c.nome?.toLowerCase().includes(t) ||
          c.email?.toLowerCase().includes(t))
      : this.clientes;
  }

  selecionarCliente(c: Usuario) { this.clienteSelecionado = c; }

  iniciais(nome: string) {
    if (!nome) return '?';
    const p = nome.trim().split(' ');
    return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length-1][0]).toUpperCase();
  }

  abrirModal() { this.form.reset({ tipoUsuario: 'CLIENTE', enderecoId: 1 }); this.modalAberto = true; }
  fecharModal() { this.modalAberto = false; }

  salvar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.salvando = true;
    this.usuarioService.cadastrar(this.form.value).subscribe({
      next: () => { this.toast.sucesso('Cliente cadastrado!'); this.fecharModal(); this.carregarClientes(); this.salvando = false; },
      error: (err: any) => { this.toast.erro(err.mensagemAmigavel || 'Erro ao cadastrar.'); this.salvando = false; }
    });
  }
}
