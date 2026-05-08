import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Tipo: cards de stats -->
    <div *ngIf="tipo === 'stats'" class="skeleton-stats-grid">
      <div class="skeleton-stat-card" *ngFor="let i of arr(count)">
        <div class="sk sk-icon"></div>
        <div class="sk-info">
          <div class="sk sk-label"></div>
          <div class="sk sk-value"></div>
        </div>
      </div>
    </div>

    <!-- Tipo: lista de itens -->
    <div *ngIf="tipo === 'lista'" class="skeleton-lista">
      <div class="skeleton-list-item" *ngFor="let i of arr(count)">
        <div class="sk sk-avatar"></div>
        <div class="sk-list-info">
          <div class="sk sk-title"></div>
          <div class="sk sk-sub"></div>
        </div>
        <div class="sk sk-badge"></div>
      </div>
    </div>

    <!-- Tipo: tabela -->
    <div *ngIf="tipo === 'tabela'" class="skeleton-tabela">
      <div class="sk sk-table-header"></div>
      <div class="skeleton-table-row" *ngFor="let i of arr(count)">
        <div class="sk sk-cell sk-cell-lg"></div>
        <div class="sk sk-cell sk-cell-md"></div>
        <div class="sk sk-cell sk-cell-sm"></div>
        <div class="sk sk-cell sk-cell-md"></div>
        <div class="sk sk-cell sk-cell-sm"></div>
      </div>
    </div>

    <!-- Tipo: cards de serviço/profissional -->
    <div *ngIf="tipo === 'cards'" class="skeleton-cards-grid">
      <div class="skeleton-card" *ngFor="let i of arr(count)">
        <div class="sk sk-card-title"></div>
        <div class="sk sk-card-sub"></div>
        <div class="sk sk-card-badge"></div>
        <div class="sk sk-card-valor"></div>
      </div>
    </div>

    <!-- Tipo: perfil -->
    <div *ngIf="tipo === 'perfil'" class="skeleton-perfil">
      <div class="sk-perfil-header">
        <div class="sk sk-avatar-lg"></div>
        <div class="sk-perfil-info">
          <div class="sk sk-perfil-nome"></div>
          <div class="sk sk-perfil-email"></div>
        </div>
      </div>
      <div class="sk sk-field" *ngFor="let i of arr(count)"></div>
    </div>

    <!-- Tipo: linha única (genérica) -->
    <div *ngIf="tipo === 'linha'" class="skeleton-linha">
      <div class="sk sk-linha" *ngFor="let i of arr(count)"></div>
    </div>
  `,
  styleUrls: ['./skeleton.component.css']
})
export class SkeletonComponent {
  @Input() tipo: 'stats' | 'lista' | 'tabela' | 'cards' | 'perfil' | 'linha' = 'lista';
  @Input() count = 4;

  arr(n: number): number[] {
    return Array(n).fill(0);
  }
}
