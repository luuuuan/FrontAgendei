import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { UsuarioService } from '../../services/usuario.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-cadastro-prestador',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './cadastro-prestador.component.html',
  styleUrls: ['./cadastro-prestador.component.css']
})
export class CadastroPrestadorComponent implements OnInit {

  stepAtual = 1;
  totalSteps = 4;
  salvando = false;
  buscandoCep = false;

  mostrarSenha = false;
  mostrarConfirmar = false;

  // Os 4 formulários separados por etapa
  formStep1: FormGroup; // Identificação
  formStep2: FormGroup; // Tipo e documentos
  formStep3: FormGroup; // Endereço
  formStep4: FormGroup; // Dados bancários

  stepTitulos = [
    { titulo: '1. Identificação',       sub: 'Quem é você?' },
    { titulo: '2. Tipo e Documentos',   sub: 'CPF ou CNPJ?' },
    { titulo: '3. Endereço',            sub: 'Onde você atende?' },
    { titulo: '4. Dados Bancários',     sub: 'Como receber pagamentos?' },
  ];

  get progressoPorcentagem(): number {
    return (this.stepAtual / this.totalSteps) * 100;
  }

  get stepInfo() {
    return this.stepTitulos[this.stepAtual - 1];
  }

  get tipoPrestador(): string {
    return this.formStep2.get('tipoPrestador')?.value || 'freelancer';
  }

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private toast: ToastService,
    private router: Router,
    private http: HttpClient
  ) {
    this.formStep1 = this.fb.group({
      nome:          ['', Validators.required],
      email:         ['', [Validators.required, Validators.email]],
      senha:         ['', [Validators.required, Validators.minLength(8)]],
      confirmarSenha:['', Validators.required],
      telefone:      ['', [Validators.required, Validators.minLength(10)]]
    });

    this.formStep2 = this.fb.group({
      tipoPrestador: ['freelancer', Validators.required],
      especialidade: ['', Validators.required],
      // freelancer
      cpf:           [''],
      nomeDisplay:   [''],
      // empresa
      cnpj:          [''],
      razaoSocial:   [''],
      bio:           ['']
    });

    this.formStep3 = this.fb.group({
      cep:       ['', [Validators.required, Validators.minLength(8)]],
      logradouro:['', Validators.required],
      numero:    ['', Validators.required],
      bairro:    ['', Validators.required],
      cidade:    ['', Validators.required],
      estado:    ['', Validators.required],
      complemento:['']
    });

    this.formStep4 = this.fb.group({
      banco:       ['', Validators.required],
      agencia:     [''],
      conta:       ['', Validators.required],
      tipoConta:   ['corrente'],
      titularDoc:  ['', Validators.required],
      pix:         ['']
    });
  }

  ngOnInit() {}

  proximo() {
    const formAtual = this.getFormAtual();
    if (!this.validarStep(formAtual)) return;
    if (this.stepAtual < this.totalSteps) {
      this.stepAtual++;
    }
  }

  voltar() {
    if (this.stepAtual > 1) this.stepAtual--;
  }

  private getFormAtual(): FormGroup {
    const forms: { [key: number]: FormGroup } = {
      1: this.formStep1,
      2: this.formStep2,
      3: this.formStep3,
      4: this.formStep4
    };
    return forms[this.stepAtual];
  }

  private validarStep(form: FormGroup): boolean {
    // Valida apenas os campos visíveis de cada step
    if (this.stepAtual === 1) {
      const { nome, email, senha, confirmarSenha, telefone } = this.formStep1.value;
      if (!nome || !email || !senha || !confirmarSenha || !telefone) {
        this.formStep1.markAllAsTouched();
        this.toast.aviso('Preencha todos os campos obrigatórios.');
        return false;
      }
      if (senha !== confirmarSenha) {
        this.toast.erro('As senhas não coincidem.');
        return false;
      }
      if (senha.length < 8) {
        this.toast.erro('A senha deve ter no mínimo 8 caracteres.');
        return false;
      }
    }

    if (this.stepAtual === 2) {
      const { especialidade, tipoPrestador, cpf, cnpj } = this.formStep2.value;
      if (!especialidade) {
        this.toast.aviso('Informe a especialidade.');
        return false;
      }
      if (tipoPrestador === 'freelancer' && !cpf) {
        this.toast.aviso('Informe o CPF.');
        return false;
      }
      if (tipoPrestador === 'empresa' && !cnpj) {
        this.toast.aviso('Informe o CNPJ.');
        return false;
      }
    }

    if (this.stepAtual === 3) {
      const { cep, logradouro, numero, bairro, cidade, estado } = this.formStep3.value;
      if (!cep || !logradouro || !numero || !bairro || !cidade || !estado) {
        this.formStep3.markAllAsTouched();
        this.toast.aviso('Preencha o endereço completo.');
        return false;
      }
    }

    if (this.stepAtual === 4) {
      const { banco, conta, titularDoc } = this.formStep4.value;
      if (!banco || !conta || !titularDoc) {
        this.formStep4.markAllAsTouched();
        this.toast.aviso('Preencha os dados bancários obrigatórios.');
        return false;
      }
      if(titularDoc != this.formStep2.value.cpf && titularDoc != this.formStep2.value.cnpj) {
        this.toast.erro('O documento do titular deve ser igual ao CPF/CNPJ informado na etapa 2.');
        return false;
      }
    }

    return true;
  }

  buscarCep() {
    const cep = this.formStep3.get('cep')?.value?.replace(/\D/g, '');
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
          this.formStep3.patchValue({
            logradouro: data.logradouro,
            bairro:     data.bairro,
            cidade:     data.localidade,
            estado:     data.uf
          });
          this.toast.sucesso('Endereço preenchido!');
        }
        this.buscandoCep = false;
      },
      error: () => {
        this.toast.erro('Erro ao buscar CEP.');
        this.buscandoCep = false;
      }
    });
  }

  finalizar() {
    if (!this.validarStep(this.formStep4)) return;
    this.salvando = true;

    const s1 = this.formStep1.value;
    const s2 = this.formStep2.value;

    // Monta payload para o backend
    const payload = {
      nome:           s1.nome,
      email:          s1.email,
      senha:          s1.senha,
      cpf:            s2.tipoPrestador === 'freelancer'
                        ? s2.cpf.replace(/\D/g, '')
                        : s2.cnpj.replace(/\D/g, ''),
      telefone:       s1.telefone.replace(/\D/g, ''),
      enderecoId:     1,        // backend precisa endpoint de endereço
      tipoUsuario:    'PRESTADOR'
    };

    this.usuarioService.cadastrar(payload).subscribe({
      next: () => {
        this.toast.sucesso('Cadastro realizado com sucesso! Faça login para acessar.');
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        this.toast.erro(err.mensagemAmigavel || 'Erro ao finalizar cadastro.');
        this.salvando = false;
      }
    });
  }

  campo(form: FormGroup, nome: string) { return form.get(nome); }
  invalido(form: FormGroup, nome: string) {
    return form.get(nome)?.invalid && form.get(nome)?.touched;
  }
}
