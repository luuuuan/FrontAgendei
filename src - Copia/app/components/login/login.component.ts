import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UsuarioService } from '../../services/usuario.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  form: FormGroup;
  formRecuperar: FormGroup;
  carregando = false;
  mostrarSenha = false;
  telaAtiva: 'login' | 'recuperar' = 'login';
  enviandoRecuperacao = false;
  recuperacaoEnviada = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private toast: ToastService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.formRecuperar = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  login() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.carregando = true;
    const { email, senha } = this.form.value;
    this.authService.login(email, senha).subscribe({
      next: (resposta) => {
        if (resposta.tipoUsuario === 'CLIENTE') {
          this.router.navigate(['/area-cliente']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err: any) => {
        this.toast.erro(err.mensagemAmigavel || 'E-mail ou senha incorretos.');
        this.carregando = false;
      }
    });
  }

  recuperarSenha() {
    if (this.formRecuperar.invalid) { this.formRecuperar.markAllAsTouched(); return; }
    this.enviandoRecuperacao = true;
    const { email } = this.formRecuperar.value;
    this.usuarioService.recuperarSenha(email).subscribe({
      next: () => {
        this.recuperacaoEnviada = true;
        this.enviandoRecuperacao = false;
        this.toast.sucesso('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      },
      error: (err: any) => {
        this.recuperacaoEnviada = true;
        this.enviandoRecuperacao = false;
        this.toast.sucesso('Se o e-mail estiver cadastrado, você receberá as instruções de recuperação.');
      }
    });
  }

  campo(nome: string) { return this.form.get(nome); }
  invalido(nome: string) { return this.campo(nome)?.invalid && this.campo(nome)?.touched; }
}
