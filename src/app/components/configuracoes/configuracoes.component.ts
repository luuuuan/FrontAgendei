import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './configuracoes.component.html',
  styleUrls: ['./configuracoes.component.css']
})
export class ConfiguracoesComponent {
  abaAtiva: 'empresa' | 'notificacoes' | 'api' = 'empresa';
  salvando = false;
  formEmpresa: FormGroup;
  formNotificacoes: FormGroup;

  constructor(private fb: FormBuilder, private toast: ToastService) {
    // Fix 4: removida obrigatoriedade (sem Validators.required nos campos)
    // Permite editar apenas os campos desejados (PATCH parcial)
    this.formEmpresa = this.fb.group({
      nomeEmpresa:       [''],
      email:             [''],
      telefone:          [''],
      endereco:          [''],
      horarioAbertura:   ['08:00'],
      horarioFechamento: ['18:00'],
      diasFuncionamento: ['Segunda a Sexta']
    });
    this.formNotificacoes = this.fb.group({
      emailConfirmacao:     [true],
      emailLembrete:        [true],
      emailCancelamento:    [true],
      antecedenciaLembrete: ['24']
    });
  }

  salvarEmpresa() {
    // Fix 4: envia apenas campos preenchidos (PATCH parcial)
    const valores = this.formEmpresa.value;
    const payload: any = {};
    Object.keys(valores).forEach(key => {
      if (valores[key] !== null && valores[key] !== '') {
        payload[key] = valores[key];
      }
    });

    if (Object.keys(payload).length === 0) {
      this.toast.aviso('Nenhuma informação para atualizar.');
      return;
    }

    this.salvando = true;
    // TODO: chamar o service quando o endpoint estiver disponível
    // this.prestadorService.atualizar(prestadorId, payload).subscribe(...)
    setTimeout(() => { this.toast.sucesso('Configurações salvas!'); this.salvando = false; }, 800);
  }

  salvarNotificacoes() {
    this.salvando = true;
    setTimeout(() => { this.toast.sucesso('Preferências salvas!'); this.salvando = false; }, 800);
  }

  get urlApi() { return 'http://localhost:8080'; }

  endpointsDisponiveis = [
    { metodo: 'POST',  rota: '/usuarios/cadastro',               descricao: 'Cadastrar usuário' },
    { metodo: 'POST',  rota: '/usuarios/login',                  descricao: 'Login' },
    { metodo: 'GET',   rota: '/usuarios/clientes',               descricao: 'Listar clientes' },
    { metodo: 'PATCH', rota: '/usuarios/atualizar-cliente/{id}', descricao: 'Atualizar cliente' },
    { metodo: 'POST',  rota: '/servico/cadastroServicos',        descricao: 'Cadastrar serviço' },
    { metodo: 'GET',   rota: '/servico/servicos',                descricao: 'Listar serviços' },
    { metodo: 'PATCH', rota: '/servico/atualizar/{id}',          descricao: 'Atualizar serviço' },
    { metodo: 'POST',  rota: '/profissional/cadastroProfissional', descricao: 'Cadastrar profissional' },
    { metodo: 'GET',   rota: '/profissional/profissionaisCadastrados', descricao: 'Listar profissionais' },
    { metodo: 'POST',  rota: '/agendamento/criarAgendamento',    descricao: 'Criar agendamento' },
    { metodo: 'GET',   rota: '/agendamento/consultaAgendamento', descricao: 'Buscar agendamentos' },
  ];

  corMetodo(m: string) { return ({ GET: 'metodo-get', POST: 'metodo-post', PUT: 'metodo-put', DELETE: 'metodo-delete', PATCH: 'metodo-patch' } as any)[m] || ''; }
}
