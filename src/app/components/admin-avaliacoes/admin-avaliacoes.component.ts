import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvaliacaoService } from '../../services/avaliacao.service';
import { ToastService } from '../../services/toast.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Avaliacao {
  id: number;
  nota: number;
  comentario?: string;
  usuarioId?: number;
  nomeUsuario?: string;
  profissionalId?: number;
  nomeProfissional?: string;
  agendamentoId?: number;
  ativo?: boolean;
}

@Component({
  selector: 'app-admin-avaliacoes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-avaliacoes.component.html',
  styleUrls: ['./admin-avaliacoes.component.css']
})
export class AdminAvaliacoesComponent implements OnInit {
  avaliacoes: Avaliacao[] = [];
  avaliacoesFiltradas: Avaliacao[] = [];
  carregando = false;
  termoBusca = '';
  filtroNota = 0;
  removendo: number | null = null;

  constructor(
    private http: HttpClient,
    private toast: ToastService
  ) {}

  ngOnInit() { this.carregar(); }

  carregar() {
    this.carregando = true;
    this.http.get<Avaliacao[]>(`${environment.apiUrl}/avaliacao/listar`).subscribe({
      next: l => { this.avaliacoes = l; this.filtrar(); this.carregando = false; },
      error: () => { this.carregando = false; }
    });
  }

  filtrar() {
    let lista = this.avaliacoes;
    if (this.filtroNota > 0) lista = lista.filter(a => a.nota === this.filtroNota);
    const t = this.termoBusca.toLowerCase().trim();
    if (t) lista = lista.filter(a =>
      a.comentario?.toLowerCase().includes(t) ||
      a.nomeUsuario?.toLowerCase().includes(t) ||
      a.nomeProfissional?.toLowerCase().includes(t)
    );
    this.avaliacoesFiltradas = lista;
  }

  remover(id: number) {
    if (!confirm('Deseja remover esta avaliação?')) return;
    this.removendo = id;
    this.http.delete(`${environment.apiUrl}/avaliacao/remover/${id}`).subscribe({
      next: () => {
        this.avaliacoes = this.avaliacoes.filter(a => a.id !== id);
        this.filtrar();
        this.toast.sucesso('Avaliação removida.');
        this.removendo = null;
      },
      error: (err: any) => { this.toast.erro(err.mensagemAmigavel || 'Erro ao remover.'); this.removendo = null; }
    });
  }

  estrelas(nota: number): number[] { return Array(nota).fill(0); }
  estrelasVazias(nota: number): number[] { return Array(5 - nota).fill(0); }
}
