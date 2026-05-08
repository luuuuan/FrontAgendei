import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

interface MenuItem { label: string; icon: string; rota: string; }

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  rotaAtiva = '/dashboard';

  menuItems: MenuItem[] = [
    { label: 'Dashboard',     icon: 'fas fa-home',           rota: '/dashboard'     },
    { label: 'Agenda',        icon: 'fas fa-calendar-alt',   rota: '/agenda'        },
    { label: 'Clientes',      icon: 'fas fa-users',          rota: '/clientes'      },
    { label: 'Serviços',      icon: 'fas fa-concierge-bell', rota: '/servicos'      },
    { label: 'Profissionais', icon: 'fas fa-user-md',        rota: '/profissionais' },
    { label: 'Financeiro',    icon: 'fas fa-dollar-sign',    rota: '/financeiro'    },
    { label: 'Relatórios',    icon: 'fas fa-chart-bar',      rota: '/relatorios'    },
    { label: 'Configurações', icon: 'fas fa-cog',            rota: '/configuracoes' },
  ];

  constructor(private router: Router) {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => { this.rotaAtiva = e.urlAfterRedirects; });
  }

  navegar(rota: string) {
    this.rotaAtiva = rota;
    this.router.navigate([rota]);
  }
}
