import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let mensagemAmigavel = 'Ocorreu um erro inesperado.';

      if (error.status === 0) {
        mensagemAmigavel = 'Não foi possível conectar ao servidor.';
      } else if (error.status === 400) {
        // Lê a mensagem que o backend enviou no body
        mensagemAmigavel = error.error?.erro
          || error.error?.message
          || 'Dados inválidos. Verifique os campos.';
      } else if (error.status === 401) {
        mensagemAmigavel = 'Acesso não autorizado.';
      } else if (error.status === 404) {
        mensagemAmigavel = 'Recurso não encontrado.';
      } else if (error.status === 500) {
        // Tenta ler a mensagem mesmo no 500
        mensagemAmigavel = error.error?.erro
          || error.error?.message
          || 'Erro interno do servidor.';
      }

      console.error('Erro HTTP:', error);
      return throwError(() => ({ ...error, mensagemAmigavel }));
    })
  );
};