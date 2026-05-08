import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastService, Toast } from '../../services/toast.service';

interface ToastItem extends Toast { id: number; }

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css']
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: ToastItem[] = [];
  private sub!: Subscription;
  private contador = 0;

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.sub = this.toastService.toast$.subscribe(toast => {
      const item: ToastItem = { ...toast, id: ++this.contador };
      this.toasts.push(item);
      setTimeout(() => this.remover(item.id), 4000);
    });
  }

  remover(id: number) { this.toasts = this.toasts.filter(t => t.id !== id); }

  icone(tipo: string): string {
    const mapa: any = { sucesso: 'fas fa-check-circle', erro: 'fas fa-exclamation-circle', aviso: 'fas fa-exclamation-triangle', info: 'fas fa-info-circle' };
    return mapa[tipo] || 'fas fa-info-circle';
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }
}
