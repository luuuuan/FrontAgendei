import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let mensagemAmigavel = 'Ocorreu um erro inesperado.';

      const backendMsg = error.error?.erro
        || error.error?.message
        || error.error?.mensagem
        || (typeof error.error === 'string' ? error.error : null);

      if (error.status === 0) {
        mensagemAmigavel = 'Não foi possível conectar ao servidor.';
      } else if (error.status === 400) {
        mensagemAmigavel = backendMsg || 'Dados inválidos. Verifique os campos.';
      } else if (error.status === 401) {
        mensagemAmigavel = backendMsg || 'Acesso não autorizado.';
      } else if (error.status === 404) {
        mensagemAmigavel = backendMsg || 'Recurso não encontrado.';
      } else if (error.status === 500) {
        mensagemAmigavel = backendMsg || 'Erro interno do servidor.';
      } else if (backendMsg) {
        mensagemAmigavel = backendMsg;
      }

      console.error('Erro HTTP:', error);
      return throwError(() => ({ ...error, mensagemAmigavel }));
    })
  );
};
