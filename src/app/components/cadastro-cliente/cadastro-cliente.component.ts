import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { UsuarioService } from '../../services/usuario.service';
import { EnderecoService } from '../../services/endereco.service';
import { ToastService } from '../../services/toast.service';

function senhasIguaisValidator(control: AbstractControl) {
  const senha = control.get('senha');
  const confirmar = control.get('confirmarSenha');
  if (senha && confirmar && senha.value !== confirmar.value) {
    confirmar.setErrors({ senhasDiferentes: true });
  } else {
    if (confirmar?.errors?.['senhasDiferentes']) {
      confirmar.setErrors(null);
    }
  }
  return null;
}

@Component({
  selector: 'app-cadastro-cliente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './cadastro-cliente.component.html',
  styleUrls: ['./cadastro-cliente.component.css']
})
export class CadastroClienteComponent {

  stepAtual = 1;
  salvando = false;
  buscandoCep = false;
  mostrarSenha = false;
  mostrarConfirmar = false;

  formStep1: FormGroup;
  formStep2: FormGroup;

  stepTitulos = [
    { titulo: 'Dados Pessoais', sub: 'Suas informações básicas' },
    { titulo: 'Endereço',       sub: 'Onde você mora?' }
  ];

  get stepInfo() { return this.stepTitulos[this.stepAtual - 1]; }
  get progressoPorcentagem() { return (this.stepAtual / 2) * 100; }

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private enderecoService: EnderecoService,
    private toast: ToastService,
    private router: Router,
    private http: HttpClient
  ) {
    this.formStep1 = this.fb.group({
      nome:           ['', Validators.required],
      sobrenome:      ['', Validators.required],
      email:          ['', [Validators.required, Validators.email]],
      telefone:       ['', [Validators.required, Validators.minLength(10)]],
      dataNascimento: ['', Validators.required],
      cpf:            ['', [Validators.required, Validators.minLength(11)]],
      senha:          ['', [Validators.required, Validators.minLength(8)]],
      confirmarSenha: ['', Validators.required],
      termos:         [false, Validators.requiredTrue]
    }, { validators: senhasIguaisValidator });

    this.formStep2 = this.fb.group({
      cep:        ['', [Validators.required, Validators.minLength(8)]],
      logradouro: ['', Validators.required],
      numero:     ['', Validators.required],
      bairro:     ['', Validators.required],
      cidade:     ['', Validators.required],
      estado:     ['', Validators.required],
      complemento:['']
    });
  }

  proximo() {
    if (this.formStep1.invalid) {
      this.formStep1.markAllAsTouched();
      this.toast.aviso('Preencha todos os campos obrigatórios.');
      return;
    }
    const v = this.formStep1.value;
    if (v.senha !== v.confirmarSenha) {
      this.toast.erro('As senhas não coincidem.');
      return;
    }
    this.stepAtual = 2;
  }

  voltar() {
    this.stepAtual = 1;
  }

  buscarCep() {
    const cep = this.formStep2.get('cep')?.value?.replace(/\D/g, '');
    if (!cep || cep.length !== 8) {
      this.toast.erro('CEP inválido. Use 8 dígitos.');
      return;
    }
    this.buscandoCep = true;
    this.http.get<any>(`https://viacep.com.br/ws/${cep}/json/`).subscribe({
      next: (data) => {
        if (data.erro) {
          this.toast.erro('CEP não encontrado.');
        } else {
          this.formStep2.patchValue({
            logradouro: data.logradouro,
            bairro:     data.bairro,
            cidade:     data.localidade,
            estado:     data.uf
          });
          this.toast.sucesso('Endereço preenchido!');
        }
        this.buscandoCep = false;
      },
      error: () => { this.toast.erro('Erro ao buscar CEP.'); this.buscandoCep = false; }
    });
  }

  salvar() {
    if (this.formStep2.invalid) {
      this.formStep2.markAllAsTouched();
      this.toast.aviso('Preencha o endereço completo.');
      return;
    }

    this.salvando = true;
    const s1 = this.formStep1.value;
    const s2 = this.formStep2.value;

    // Passo 1: cria o endereço
    this.enderecoService.criar({
      cep:         s2.cep.replace(/\D/g, ''),
      logradouro:  s2.logradouro,
      numero:      s2.numero,
      complemento: s2.complemento || undefined,
      bairro:      s2.bairro,
      cidade:      s2.cidade,
      estado:      s2.estado
    }).subscribe({
      next: (enderecoResponse) => {
        // Passo 2: cadastra o usuário com o enderecoId retornado
        const payload = {
          nome:           `${s1.nome} ${s1.sobrenome}`.trim(),
          email:          s1.email,
          senha:          s1.senha,
          cpf:            s1.cpf.replace(/\D/g, ''),
          telefone:       s1.telefone.replace(/\D/g, ''),
          dataNascimento: s1.dataNascimento,
          enderecoId:     enderecoResponse.id,
          tipoUsuario:    'CLIENTE'
        };

        this.usuarioService.cadastrar(payload).subscribe({
          next: () => {
            this.toast.sucesso('Conta criada! Verifique seu e-mail para confirmar a conta.');
            // Dispara e-mail de confirmação
            this.usuarioService.solicitarConfirmacaoConta(payload.email).subscribe();
            this.router.navigate(['/login']);
          },
          error: (err: any) => {
            this.toast.erro(err.mensagemAmigavel || 'Erro ao criar conta. Verifique os dados.');
            this.salvando = false;
          }
        });
      },
      error: (err: any) => {
        this.toast.erro(err.mensagemAmigavel || 'Erro ao salvar endereço.');
        this.salvando = false;
      }
    });
  }

  campo(form: FormGroup, nome: string) { return form.get(nome); }
  invalido(form: FormGroup, nome: string) {
    return form.get(nome)?.invalid && form.get(nome)?.touched;
  }

  toggleSenha(c: 'senha' | 'confirmar') {
    if (c === 'senha') this.mostrarSenha = !this.mostrarSenha;
    else this.mostrarConfirmar = !this.mostrarConfirmar;
  }

  aplicarMascaraTelefone(event: any) {
    let v = event.target.value.replace(/\D/g, '').slice(0, 11);
    if (v.length <= 10) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    else v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    event.target.value = v;
    this.formStep1.get('telefone')?.setValue(v, { emitEvent: false });
  }

  aplicarMascaraCpf(event: any) {
    let v = event.target.value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    event.target.value = v;
    this.formStep1.get('cpf')?.setValue(v, { emitEvent: false });
  }

  aplicarMascaraCep(event: any) {
    let v = event.target.value.replace(/\D/g, '').slice(0, 8);
    v = v.replace(/(\d{5})(\d{0,3})/, '$1-$2');
    event.target.value = v;
    this.formStep2.get('cep')?.setValue(v, { emitEvent: false });
  }
}
