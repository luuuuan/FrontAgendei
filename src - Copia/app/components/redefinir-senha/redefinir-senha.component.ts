import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';
import { ToastService } from '../../services/toast.service';

function senhasIguaisValidator(control: AbstractControl) {
  const nova = control.get('novaSenha');
  const confirmar = control.get('confirmarSenha');
  if (nova && confirmar && nova.value !== confirmar.value) {
    confirmar.setErrors({ senhasDiferentes: true });
  } else {
    if (confirmar?.errors?.['senhasDiferentes']) {
      confirmar.setErrors(null);
    }
  }
  return null;
}

@Component({
  selector: 'app-redefinir-senha',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './redefinir-senha.component.html',
  styleUrls: ['./redefinir-senha.component.css']
})
export class RedefinirSenhaComponent implements OnInit {
  form: FormGroup;
  token = '';
  tokenInvalido = false;
  salvando = false;
  concluido = false;
  mostrarNova = false;
  mostrarConfirmar = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private usuarioService: UsuarioService,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      novaSenha: ['', [Validators.required, Validators.minLength(8)]],
      confirmarSenha: ['', Validators.required]
    }, { validators: senhasIguaisValidator });
  }

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.tokenInvalido = true;
    }
  }

  redefinir() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.salvando = true;

    this.usuarioService.redefinirSenha(this.token, this.form.value.novaSenha).subscribe({
      next: () => {
        this.concluido = true;
        this.salvando = false;
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err: any) => {
        const msg = err.mensagemAmigavel || err.error?.message || 'Token inválido ou expirado.';
        this.toast.erro(msg);
        this.salvando = false;
        if (err.status === 400 || err.status === 404) {
          this.tokenInvalido = true;
        }
      }
    });
  }

  campo(nome: string) { return this.form.get(nome); }
  invalido(nome: string) { return this.campo(nome)?.invalid && this.campo(nome)?.touched; }

  forca(senha: string): number {
    if (!senha) return 0;
    let pts = 0;
    if (senha.length >= 8) pts += 25;
    if (senha.length >= 12) pts += 15;
    if (/[A-Z]/.test(senha)) pts += 20;
    if (/[0-9]/.test(senha)) pts += 20;
    if (/[^A-Za-z0-9]/.test(senha)) pts += 20;
    return Math.min(pts, 100);
  }

  corForca(senha: string): string {
    const f = this.forca(senha);
    if (f < 40) return '#ef4444';
    if (f < 70) return '#f59e0b';
    return '#22c55e';
  }

  labelForca(senha: string): string {
    const f = this.forca(senha);
    if (f < 40) return 'Fraca';
    if (f < 70) return 'Média';
    return 'Forte';
  }

}