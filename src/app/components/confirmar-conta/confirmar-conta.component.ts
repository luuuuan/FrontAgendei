import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-confirmar-conta',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmar-conta.component.html',
  styleUrls: ['./confirmar-conta.component.css']
})
export class ConfirmarContaComponent implements OnInit {
  estado: 'carregando' | 'sucesso' | 'expirado' | 'erro' = 'carregando';
  mensagem = '';
  email = '';
  reenviando = false;
  reenviado = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    const email = this.route.snapshot.queryParamMap.get('email');
    this.email = email || '';

    if (!token || !email) {
      this.estado = 'erro';
      this.mensagem = 'Link inválido. Verifique o e-mail recebido.';
      return;
    }

    this.http.post(`${environment.apiUrl}/usuarios/contaConfirmada`, { email, token }).subscribe({
      next: () => {
        this.estado = 'sucesso';
        this.mensagem = 'Conta confirmada com sucesso! Você já pode fazer login.';
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err: any) => {
        const msg = err.error?.erro || err.error?.mensagem || '';
        if (msg.toLowerCase().includes('expirado')) {
          this.estado = 'expirado';
          this.mensagem = 'O link expirou. Solicite um novo e-mail de confirmação.';
        } else {
          this.estado = 'erro';
          this.mensagem = msg || 'Erro ao confirmar conta.';
        }
      }
    });
  }

  irParaLogin() { this.router.navigate(['/login']); }

  reenviarLink() {
    if (!this.email) return;
    this.reenviando = true;
    this.http.post(`${environment.apiUrl}/usuarios/confirmarConta`, { email: this.email }).subscribe({
      next: () => { this.reenviado = true; this.reenviando = false; },
      error: () => { this.reenviando = false; }
    });
  }
}
