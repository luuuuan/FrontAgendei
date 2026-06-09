import { environment } from '../../../environments/environment';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { GradeTrabalhoService } from '../../services/grade-trabalho.service';
import { BancoService, Banco } from '../../services/banco.service';
import { DadosBancariosService } from '../../services/dados-bancarios.service';
import { UsuarioService } from '../../services/usuario.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './configuracoes.component.html',
  styleUrls: ['./configuracoes.component.css']
})
export class ConfiguracoesComponent implements OnInit {
  abaAtiva: 'empresa' | 'notificacoes' | 'bancario' = 'empresa';
  salvandoBancario = false;
  dadosBancariosId: number | null = null;
  salvando = false;
  carregandoGrade = false;
  gradeId: number | null = null;
  buscandoCep = false;
  formEmpresa: FormGroup;
  formNotificacoes: FormGroup;
  formBancario: FormGroup;

  bancos: Banco[] = [];
  bancosFiltrados: Banco[] = [];
  termoBanco = '';
  mostrarSugestoesBanco = false;
  bancoSelecionado: Banco | null = null;

  tiposConta = [
    { valor: 'CORRENTE', label: 'Conta Corrente' },
    { valor: 'POUPANCA', label: 'Conta Poupança' },
    { valor: 'PAGAMENTO', label: 'Conta de Pagamento' },
  ];

  diasMap: Record<string, string> = {
    'Segunda a Sexta': 'SEG_SEX',
    'Segunda a Sábado': 'SEG_SAB',
    'Segunda a Domingo': 'SEG_DOM',
  };

  diasMapInverso: Record<string, string> = {
    'SEG_SEX': 'Segunda a Sexta',
    'SEG_SAB': 'Segunda a Sábado',
    'SEG_DOM': 'Segunda a Domingo',
  };

  constructor(
    private fb: FormBuilder,
    private toast: ToastService,
    private http: HttpClient,
    private authService: AuthService,
    private gradeTrabalhoService: GradeTrabalhoService,
    private usuarioService: UsuarioService,
    private bancoService: BancoService,
    private dadosBancariosService: DadosBancariosService
  ) {
    this.formEmpresa = this.fb.group({
      nomeEmpresa: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefone: [''],
      endereco: [''],
      horarioAbertura: ['08:00'],
      horarioFechamento: ['18:00'],
      diasFuncionamento: ['Segunda a Sexta'],
      temIntervalo: [false],
      inicioIntervalo: ['12:00'],
      fimIntervalo: ['13:00'],
      cep: [''],
      logradouro: [''],
      numero: [''],
      complemento: [''],
      bairro: [''],
      cidade: [''],
      estado: [''],
    });

    this.formBancario = this.fb.group({
      banco: ['', Validators.required],
      agencia: ['', Validators.required],
      conta: ['', Validators.required],
      digitoConta: [''],
      tipoConta: ['CORRENTE', Validators.required],
      cpfTitular: ['', Validators.required],
      nomeTitular: ['', Validators.required],
    });

    this.formNotificacoes = this.fb.group({
      emailConfirmacao: [true],
      emailLembrete: [true],
      emailCancelamento: [true],
      whatAppNotificacao: [false],
      antecedenciaLembrete: [24]
    });
  }

  ngOnInit() {
    this.carregarDadosPrestador();
    this.carregarGrade();
    this.carregarDadosBancarios();
    this.carregarPreferenciasNotificacao();
    this.bancoService.listar().subscribe({
      next: l => {
        this.bancos = l.filter((b, i, arr) => arr.findIndex(x => x.id === b.id) === i);
      },
      error: () => { }
    });
  }

  carregarDadosBancarios() {
    const sessao = this.authService.getSessao();
    if (!sessao?.prestadorId) return;
    this.dadosBancariosService.buscarPorPrestador(sessao.prestadorId).subscribe({
      next: (dados: any) => {
        if (dados) {
          this.dadosBancariosId = dados.id ?? null;
          this.formBancario.patchValue({
            bancoid: dados.banco || '',
            agencia: dados.agencia || '',
            conta: dados.conta || '',
            digitoConta: dados.digitoConta || '',
            tipoConta: dados.tipoConta || 'CORRENTE',
            cpfTitular: dados.cpfTitular || '',
            nomeTitular: dados.nomeTitular || '',
          });
        }
      },
      error: () => { } // sem dados ainda
    });
  }

  salvarDadosBancarios() {
    if (this.formBancario.invalid) { this.formBancario.markAllAsTouched(); return; }
    const sessao = this.authService.getSessao();
    if (!sessao?.prestadorId) return;

    const v = this.formBancario.value;
    const payload = {
      bancoId:     v.banco,  // back espera bancoId
      agencia:     v.agencia,
      conta:       v.conta,
      digitoConta: v.digitoConta,
      tipoConta:   v.tipoConta,
      cpfTitular:  v.cpfTitular,
      nomeTitular: v.nomeTitular,
      prestadorId: sessao.prestadorId
    };

    this.salvandoBancario = true;
    const operacao = this.dadosBancariosId
      ? this.dadosBancariosService.atualizar(this.dadosBancariosId, payload as any)
      : this.dadosBancariosService.cadastrar(payload as any);

    operacao.subscribe({
      next: (dados) => {
        this.dadosBancariosId = dados.id ?? this.dadosBancariosId;
        this.toast.sucesso('Dados bancários salvos com sucesso!');
        this.salvandoBancario = false;
      },
      error: (err: any) => {
        this.toast.erro(err.mensagemAmigavel || 'Erro ao salvar dados bancários.');
        this.salvandoBancario = false;
      }
    });
  }

  aplicarMascaraAgencia(event: any) {
    let v = event.target.value.replace(/\D/g, '').slice(0, 6);
    event.target.value = v;
    this.formBancario.get('agencia')?.setValue(v, { emitEvent: false });
  }

  aplicarMascaraConta(event: any) {
    let v = event.target.value.replace(/\D/g, '').slice(0, 12);
    event.target.value = v;
    this.formBancario.get('conta')?.setValue(v, { emitEvent: false });
  }

  aplicarMascaraCpfCnpjTitular(event: any) {
    let v = event.target.value.replace(/\D/g, '');
    if (v.length <= 11) {
      // CPF
      v = v.slice(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    } else {
      // CNPJ
      v = v.slice(0, 14).replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
    }
    event.target.value = v;
    this.formBancario.get('cpfTitular')?.setValue(v, { emitEvent: false });
  }

  carregarDadosPrestador() {
    const sessao = this.authService.getSessao();
    if (!sessao?.usuarioId) return;
    this.usuarioService.buscarPorId(sessao.usuarioId).subscribe({
      next: (usuario) => {
        const nome = (usuario as any).nomeFantasia || (usuario as any).razaoSocial || usuario.nome || '';
        const email = usuario.email || '';
        const telefone = usuario.telefone || '';
        const endereco = (usuario as any).endereco?.logradouro
          ? `${(usuario as any).endereco.logradouro}, ${(usuario as any).endereco.numero} - ${(usuario as any).endereco.bairro}`
          : '';
        // Se não veio endereco no usuario, busca separado
        const end = (usuario as any).endereco;
        this.formEmpresa.patchValue({
          nomeEmpresa: nome,
          email,
          telefone,
          endereco,
          cep: end?.cep || '',
          logradouro: end?.logradouro || '',
          numero: end?.numero || '',
          complemento: end?.complemento || '',
          bairro: end?.bairro || '',
          cidade: end?.cidade || '',
          estado: end?.estado || '',
        });
      },
      error: () => { }
    });
  }

  carregarGrade() {
    const sessao = this.authService.getSessao();
    if (!sessao?.prestadorId) return;
    this.carregandoGrade = true;
    this.gradeTrabalhoService.buscarPorPrestador(sessao.prestadorId).subscribe({
      next: (grades) => {
        this.carregandoGrade = false;
        if (grades.length > 0) {
          const g = grades[0];
          this.gradeId = g.id ?? null;
          this.formEmpresa.patchValue({
            horarioAbertura: g.horaInicio,
            horarioFechamento: g.horaFim,
            diasFuncionamento: this.diasMapInverso[g.diasSemana] || g.diasSemana,
            temIntervalo: !!(g.inicioIntervalo && g.fimIntervalo),
            inicioIntervalo: g.inicioIntervalo || '12:00',
            fimIntervalo: g.fimIntervalo || '13:00',
          });
        }
      },
      error: () => { this.carregandoGrade = false; }
    });
  }

  filtrarBancos() {
    const t = this.termoBanco.toLowerCase().trim();
    this.bancosFiltrados = t.length >= 2
      ? this.bancos.filter(b =>
        b.nome.toLowerCase().includes(t) ||
        b.codigo.includes(t)
      ).slice(0, 8)
      : [];
    this.mostrarSugestoesBanco = this.bancosFiltrados.length > 0;
  }

  selecionarBanco(banco: Banco) {
    this.bancoSelecionado = banco;
    this.termoBanco = banco.nome;
    this.mostrarSugestoesBanco = false;
    this.formBancario.get('banco')?.setValue(banco.id);
  }

  fecharSugestoes() {
    setTimeout(() => { this.mostrarSugestoesBanco = false; }, 200);
  }

  buscarCep() {
    const cep = this.formEmpresa.get('cep')?.value?.replace(/\D/g, '');
    if (!cep || cep.length !== 8) { this.toast.erro('CEP inválido.'); return; }
    this.buscandoCep = true;
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
      .then(r => r.json())
      .then((data: any) => {
        if (data.erro) { this.toast.erro('CEP não encontrado.'); }
        else {
          this.formEmpresa.patchValue({
            logradouro: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf
          });
          this.toast.sucesso('Endereço preenchido!');
        }
        this.buscandoCep = false;
      })
      .catch(() => { this.toast.erro('Erro ao buscar CEP.'); this.buscandoCep = false; });
  }

  aplicarMascaraCep(event: any) {
    let v = event.target.value.replace(/\D/g, '').slice(0, 8);
    v = v.replace(/(\d{5})(\d{0,3})/, '$1-$2');
    event.target.value = v;
    this.formEmpresa.get('cep')?.setValue(v, { emitEvent: false });
  }

  salvarEmpresa() {
    if (this.formEmpresa.invalid) { this.formEmpresa.markAllAsTouched(); return; }
    const sessao = this.authService.getSessao();
    if (!sessao?.prestadorId) { this.toast.erro('Sessão inválida.'); return; }

    const v = this.formEmpresa.value;
    const payload = {
      prestadorId: sessao.prestadorId,
      diasSemana: this.diasMap[v.diasFuncionamento] || 'SEG_SEX',
      horaInicio: v.horarioAbertura,
      horaFim: v.horarioFechamento,
      inicioIntervalo: v.temIntervalo ? v.inicioIntervalo : undefined,
      fimIntervalo: v.temIntervalo ? v.fimIntervalo : undefined,
      ativo: true
    };

    this.salvando = true;
    const operacao = this.gradeId
      ? this.gradeTrabalhoService.atualizar(this.gradeId, payload)
      : this.gradeTrabalhoService.cadastrar(payload);

    operacao.subscribe({
      next: (g: any) => {
        this.gradeId = g.id ?? this.gradeId;
        this.toast.sucesso('Configurações e horário de funcionamento salvos!');
        this.salvando = false;
      },
      error: (err: any) => {
        this.toast.erro(err.mensagemAmigavel || 'Erro ao salvar.');
        this.salvando = false;
      }
    });
  }

  salvarToggle() {
    // Salva automaticamente ao clicar no toggle
    const sessao = this.authService.getSessao();
    if (!sessao?.usuarioId) return;
    const payload = { usuarioId: sessao.usuarioId, ...this.formNotificacoes.value };
    this.http.post(`${environment.apiUrl}/preferenciasNotificacao/usuario/${sessao.usuarioId}`, payload).subscribe({
      next: () => this.toast.sucesso('Preferência salva!'),
      error: (err: any) => this.toast.erro(err.mensagemAmigavel || 'Erro ao salvar.')
    });
  }

  salvarNotificacoes() {
    if (this.formNotificacoes.invalid) return;
    const sessao = this.authService.getSessao();
    if (!sessao?.usuarioId) return;

    this.salvando = true;
    const payload = {
      usuarioId: sessao.usuarioId,
      ...this.formNotificacoes.value
    };

    this.http.post(`${environment.apiUrl}/preferenciasNotificacao/usuario/${sessao.usuarioId}`, payload).subscribe({
      next: () => { this.toast.sucesso('Preferências salvas!'); this.salvando = false; },
      error: (err: any) => {
        this.toast.erro(err.mensagemAmigavel || 'Erro ao salvar preferências.');
        this.salvando = false;
      }
    });
  }

  carregarPreferenciasNotificacao() {
    const sessao = this.authService.getSessao();
    if (!sessao?.usuarioId) return;
    this.http.get<any>(`${environment.apiUrl}/preferenciasNotificacao/usuario/${sessao.usuarioId}`).subscribe({
      next: (prefs) => {
        if (prefs) this.formNotificacoes.patchValue(prefs);
      },
      error: () => {}
    });
  }

  get urlApi() { return 'http://localhost:8080'; }
  get temIntervalo(): boolean { return this.formEmpresa.get('temIntervalo')?.value === true; }


}
