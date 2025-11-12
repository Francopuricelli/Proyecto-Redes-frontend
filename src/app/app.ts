import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { SessionModalComponent } from './components/session-modal/session-modal.component';
import { SessionService } from './services/session.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, SessionModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  title = 'Red Social';

  constructor(
    private sessionService: SessionService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Iniciar monitoreo de sesión solo si el usuario está autenticado
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.authService.isAuthenticated()) {
        this.sessionService.iniciarMonitoreo();
      } else {
        this.sessionService.detenerMonitoreo();
      }
    });

    // Iniciar monitoreo inicial si ya está autenticado
    if (this.authService.isAuthenticated()) {
      this.sessionService.iniciarMonitoreo();
    }
  }
}
