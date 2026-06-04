import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ToastComponent } from './components/toast/toast.component';
import { RouterModule } from '@angular/router';


const ROTAS_SEM_LAYOUT = ['/login', '/cadastro-cliente', '/cadastro-prestador', '/area-cliente', '/explorar', '/confirmar-conta'];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent, ToastComponent, RouterModule],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  mostrarLayout = false;

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        const url: string = e.urlAfterRedirects;
        this.mostrarLayout = !ROTAS_SEM_LAYOUT.some(r => url.startsWith(r));
      });
  }
}
