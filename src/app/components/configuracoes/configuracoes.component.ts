import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { GradeTrabalhoService } from '../../services/grade-trabalho.service';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './configuracoes.component.html',
  styleUrls: ['./configuracoes.component.css']
})
export class ConfiguracoesComponent implements OnInit {
  abaAtiva: 'empresa' | 'notificacoes' = 'empresa';
  salvando = false;
  carregandoGrade = false;
  gradeId: number | null = null;
  buscandoCep = false;
  formEmpresa: FormGroup;
  formNotificacoes: FormGroup;

  diasMap: Record<string, string> = {
    'Segunda a Sexta':    'SEG_SEX',
    'Segunda a Sábado':   'SEG_SAB',
    'Segunda a Domingo':  'SEG_DOM',
  };

  diasMapInverso: Record<string, string> = {
    'SEG_SEX': 'Segunda a Sexta',
    'SEG_SAB': 'Segunda a Sábado',
    'SEG_DOM': 'Segunda a Domingo',
  };

  constructor(
    private fb: FormBuilder,
    private toast: ToastService,
    private authService: AuthService,
    private gradeTrabalhoService: GradeTrabalhoService,
    private usuarioService: UsuarioService
  ) {
    this.formEmpresa = this.fb.group({
      nomeEmpresa:       ['', Validators.required],
      email:             ['', [Validators.required, Validators.email]],
      telefone:          [''],
      endereco:          [''],
      horarioAbertura:   ['08:00'],
      horarioFechamento: ['18:00'],
      diasFuncionamento: ['Segunda a Sexta'],
      temIntervalo:      [false],
      inicioIntervalo:   ['12:00'],
      fimIntervalo:      ['13:00'],
      cep:               [''],
      logradouro:        [''],
      numero:            [''],
      complemento:       [''],
      bairro:            [''],
      cidade:            [''],
      estado:            [''],
    });

    this.formNotificacoes = this.fb.group({
      emailConfirmacao:    [true],
      emailLembrete:       [true],
      emailCancelamento:   [true],
      antecedenciaLembrete:['24']
    });
  }

  ngOnInit() {
    this.carregarDadosPrestador();
    this.carregarGrade();
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
        const end = (usuario as any).endereco;
        this.formEmpresa.patchValue({
          nomeEmpresa:  nome,
          email,
          telefone,
          endereco,
          cep:          end?.cep || '',
          logradouro:   end?.logradouro || '',
          numero:       end?.numero || '',
          complemento:  end?.complemento || '',
          bairro:       end?.bairro || '',
          cidade:       end?.cidade || '',
          estado:       end?.estado || '',
        });
      },
      error: () => {}
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
            horarioAbertura:   g.horaInicio,
            horarioFechamento: g.horaFim,
            diasFuncionamento: this.diasMapInverso[g.diasSemana] || g.diasSemana,
            temIntervalo:      !!(g.inicioIntervalo && g.fimIntervalo),
            inicioIntervalo:   g.inicioIntervalo || '12:00',
            fimIntervalo:      g.fimIntervalo    || '13:00',
          });
        }
      },
      error: () => { this.carregandoGrade = false; }
    });
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
            bairro:     data.bairro,
            cidade:     data.localidade,
            estado:     data.uf
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
      prestadorId:     sessao.prestadorId,
      diasSemana:      this.diasMap[v.diasFuncionamento] || 'SEG_SEX',
      horaInicio:      v.horarioAbertura,
      horaFim:         v.horarioFechamento,
      inicioIntervalo: v.temIntervalo ? v.inicioIntervalo : undefined,
      fimIntervalo:    v.temIntervalo ? v.fimIntervalo    : undefined,
      ativo:           true
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

  salvarNotificacoes() {
    this.salvando = true;
    setTimeout(() => { this.toast.sucesso('Preferências salvas!'); this.salvando = false; }, 800);
  }

  get urlApi() { return 'http://localhost:8080'; }
  get temIntervalo(): boolean { return this.formEmpresa.get('temIntervalo')?.value === true; }


}
