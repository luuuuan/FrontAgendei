import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const tipo = authService.getTipoUsuario();
  if (tipo === 'ADMIN') return true;
  router.navigate(['/dashboard']);
  return false;
};
