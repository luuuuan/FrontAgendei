import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { ClienteGuard } from './guards/cliente.guard';

export const routes: Routes = [
  // 
  { path: 'login',              loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  { path: 'cadastro-cliente',   loadComponent: () => import('./components/cadastro-cliente/cadastro-cliente.component').then(m => m.CadastroClienteComponent) },
  { path: 'redefinir-senha',    loadComponent: () => import('./components/redefinir-senha/redefinir-senha.component').then(m => m.RedefinirSenhaComponent) },
  { path: 'cadastro-prestador', loadComponent: () => import('./components/cadastro-prestador/cadastro-prestador.component').then(m => m.CadastroPrestadorComponent) },

  { path: 'area-cliente', loadComponent: () => import('./components/area-cliente/area-cliente.component').then(m => m.AreaClienteComponent), canActivate: [ClienteGuard] },

  { path: '',              redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard',     loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),         canActivate: [AuthGuard] },
  { path: 'agenda',        loadComponent: () => import('./components/agenda/agenda.component').then(m => m.AgendaComponent),                   canActivate: [AuthGuard] },
  { path: 'clientes',      loadComponent: () => import('./components/clientes/clientes.component').then(m => m.ClientesComponent),             canActivate: [AuthGuard] },
  { path: 'servicos',      loadComponent: () => import('./components/servicos/servicos.component').then(m => m.ServicosComponent),             canActivate: [AuthGuard] },
  { path: 'profissionais', loadComponent: () => import('./components/profissionais/profissionais.component').then(m => m.ProfissionaisComponent), canActivate: [AuthGuard] },
  { path: 'financeiro',    loadComponent: () => import('./components/financeiro/financeiro.component').then(m => m.FinanceiroComponent),       canActivate: [AuthGuard] },
  { path: 'relatorios',    loadComponent: () => import('./components/relatorios/relatorios.component').then(m => m.RelatoriosComponent),       canActivate: [AuthGuard] },
  { path: 'horarios',      loadComponent: () => import('./components/horarios/horarios.component').then(m => m.HorariosComponent),         canActivate: [AuthGuard] },
  { path: 'configuracoes', loadComponent: () => import('./components/configuracoes/configuracoes.component').then(m => m.ConfiguracoesComponent), canActivate: [AuthGuard] },

  { path: '**', redirectTo: '/login' }
];
