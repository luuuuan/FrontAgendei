import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';
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
  form: FormGroup;
  salvando = false;
  mostrarSenha = false;
  mostrarConfirmar = false;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private toast: ToastService,
    private router: Router
  ) {
    this.form = this.fb.group({
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
  }

  toggleSenha(campo: 'senha' | 'confirmar') {
    if (campo === 'senha') this.mostrarSenha = !this.mostrarSenha;
    else this.mostrarConfirmar = !this.mostrarConfirmar;
  }

  salvar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.salvando = true;

    const v = this.form.value;
    const payload = {
      nome:           `${v.nome} ${v.sobrenome}`.trim(),
      email:          v.email,
      senha:          v.senha,
      cpf:            v.cpf.replace(/\D/g, ''),
      telefone:       v.telefone.replace(/\D/g, ''),
      dataNascimento: v.dataNascimento,
      enderecoId:     1,
      tipoUsuario:    'CLIENTE'
    };

    this.usuarioService.cadastrar(payload).subscribe({
      next: () => {
        this.toast.sucesso('Conta criada com sucesso! Faça login para continuar.');
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        this.toast.erro(err.mensagemAmigavel || 'Erro ao criar conta. Verifique os dados.');
        this.salvando = false;
      }
    });
  }

  // Helpers de erro
  campo(nome: string) { return this.form.get(nome); }
  invalido(nome: string) { return this.campo(nome)?.invalid && this.campo(nome)?.touched; }

  aplicarMascaraTelefone(event: any) {
    let v = event.target.value.replace(/\D/g, '').slice(0, 11);
    if (v.length <= 10) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    else v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    event.target.value = v;
    this.form.get('telefone')?.setValue(v, { emitEvent: false });
  }

  aplicarMascaraCpf(event: any) {
    let v = event.target.value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    event.target.value = v;
    this.form.get('cpf')?.setValue(v, { emitEvent: false });
  }

}