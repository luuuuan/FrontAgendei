import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  mensagem: string;
  tipo: 'sucesso' | 'erro' | 'aviso' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  private toastSubject = new Subject<Toast>();
  toast$ = this.toastSubject.asObservable();

  mostrar(mensagem: string, tipo: Toast['tipo'] = 'info') {
    this.toastSubject.next({ mensagem, tipo });
  }

  sucesso(mensagem: string) {
    this.mostrar(mensagem, 'sucesso');
  }

  erro(mensagem: string) {
    this.mostrar(mensagem, 'erro');
  }

  aviso(mensagem: string) {
    this.mostrar(mensagem, 'aviso');
  }
}
