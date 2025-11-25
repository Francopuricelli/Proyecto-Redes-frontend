import { Component, OnInit, PLATFORM_ID, Inject, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { filter, Subscription } from 'rxjs';
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
export class App implements OnInit, OnDestroy {
  title = 'Red Social';
  sessionCountdown: number = 0;
  private countdownSubscription: Subscription | null = null;

  constructor(
    private sessionService: SessionService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Suscribirse al countdown de sesión
    this.countdownSubscription = this.sessionService.sessionCountdown$.subscribe(segundos => {
      this.sessionCountdown = segundos;
      this.cdr.markForCheck();
    });

    // Iniciar monitoreo de sesión solo si el usuario está autenticado
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.authService.isAuthenticated()) {
        this.sessionService.iniciarMonitoreo();
      } else {
        this.sessionService.detenerMonitoreo();
        this.sessionCountdown = 0;
        this.cdr.markForCheck();
      }
    });

    // Iniciar monitoreo inicial si ya está autenticado
    if (this.authService.isAuthenticated()) {
      this.sessionService.iniciarMonitoreo();
    }
  }

  ngOnDestroy(): void {
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
  }

  formatTime(segundos: number): string {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  }
}
