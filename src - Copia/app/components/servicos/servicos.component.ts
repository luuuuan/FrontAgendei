import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ServicoService } from '../../services/servico.service';
import { ProfissionalService } from '../../services/profissional.service';
import { ToastService } from '../../services/toast.service';
import { Servico, Profissional } from '../../models/models';

@Component({
  selector: 'app-servicos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './servicos.component.html',
  styleUrls: ['./servicos.component.css']
})
export class ServicosComponent implements OnInit {
  servicos: Servico[] = []; servicosFiltrados: Servico[] = []; profissionais: Profissional[] = [];
  carregando = false; erro = ''; modalAberto = false; salvando = false; termoBusca = '';
  form: FormGroup;

  constructor(private fb: FormBuilder, private servicoService: ServicoService, private profissionalService: ProfissionalService, private toast: ToastService) {
    this.form = this.fb.group({
      nome: ['', Validators.required], descricao: ['', Validators.required],
      duracaoMinutos: ['', [Validators.required, Validators.min(1)]], tempoBuffer: [0],
      valor: ['', [Validators.required, Validators.min(0)]], profissionalId: ['', Validators.required], statusServico: ['ATIVO']
    });
  }

  ngOnInit() {
    this.carregarServicos();
    this.profissionalService.listar().subscribe({ next: l => this.profissionais = l, error: () => { } });
  }

  carregarServicos() {
    this.carregando = true; this.erro = '';
    this.servicoService.listar().subscribe({
      next: l => { this.servicos = l; this.servicosFiltrados = l; this.carregando = false; },
      error: (err: any) => { this.erro = err.mensagemAmigavel || 'Erro ao carregar.'; this.carregando = false; }
    });
  }

  filtrar() {
    const t = this.termoBusca.toLowerCase().trim();
    this.servicosFiltrados = t ? this.servicos.filter(s => s.nome?.toLowerCase().includes(t)) : this.servicos;
  }

  nomeProfissional(id: number) { const p = this.profissionais.find(p => p.id === id); return p?.nome || `#${id}`; }
  classeStatus(s: string) { return s === 'ATIVO' ? 'badge-success' : 'badge-gray'; }
  abrirModal() { this.form.reset({ statusServico: 'ATIVO', tempoBuffer: 0 }); this.modalAberto = true; }
  fecharModal() { this.modalAberto = false; }

  salvar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.salvando = true;
    const payload: Servico = { ...this.form.value, duracaoMinutos: Number(this.form.value.duracaoMinutos), valor: Number(this.form.value.valor), profissionalId: Number(this.form.value.profissionalId) };
    this.servicoService.cadastrar(payload).subscribe({
      next: () => { this.toast.sucesso('Serviço cadastrado!'); this.fecharModal(); this.carregarServicos(); this.salvando = false; },
      error: (err: any) => { this.toast.erro(err.mensagemAmigavel || 'Erro ao cadastrar.'); this.salvando = false; }
    });
  }
}
