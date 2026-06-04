import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.estaLogado()) {
    router.navigate(['/login']);
    return false;
  }

  const tipo = authService.getTipoUsuario();
  if (tipo === 'CLIENTE') {
    router.navigate(['/area-cliente']);
    return false;
  }

  return true;
};
