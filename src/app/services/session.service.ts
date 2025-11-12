import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, interval, Subscription } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly SESSION_WARNING_TIME = 10 * 60 * 1000; // 10 minutos en milisegundos
  private readonly TOKEN_EXPIRATION_TIME = 15 * 60 * 1000; // 15 minutos en milisegundos
  private sessionTimer: Subscription | null = null;
  private lastActivityTime: number = Date.now();
  
  public showWarningModal$ = new Subject<boolean>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  iniciarMonitoreo(): void {
    this.lastActivityTime = Date.now();
    this.detenerMonitoreo();

    // Verificar cada minuto
    this.sessionTimer = interval(60000).subscribe(() => {
      const tiempoTranscurrido = Date.now() - this.lastActivityTime;

      if (tiempoTranscurrido >= this.SESSION_WARNING_TIME && tiempoTranscurrido < this.TOKEN_EXPIRATION_TIME) {
        // Mostrar modal de advertencia a los 10 minutos
        this.showWarningModal$.next(true);
      } else if (tiempoTranscurrido >= this.TOKEN_EXPIRATION_TIME) {
        // Cerrar sesión automáticamente a los 15 minutos
        this.cerrarSesion();
      }
    });

    // Monitorear actividad del usuario
    this.monitorearActividad();
  }

  detenerMonitoreo(): void {
    if (this.sessionTimer) {
      this.sessionTimer.unsubscribe();
      this.sessionTimer = null;
    }
  }

  private monitorearActividad(): void {
    if (typeof window !== 'undefined') {
      // Resetear timer en cualquier actividad del usuario
      ['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
        window.addEventListener(event, () => this.resetearTimer(), { passive: true });
      });
    }
  }

  resetearTimer(): void {
    this.lastActivityTime = Date.now();
  }

  extenderSesion(): void {
    this.authService.refrescarToken().subscribe({
      next: (response: any) => {
        console.log('Token refrescado exitosamente');
        this.resetearTimer();
        this.showWarningModal$.next(false);
      },
      error: (error: any) => {
        console.error('Error al refrescar token:', error);
        this.cerrarSesion();
      }
    });
  }

  cerrarSesion(): void {
    this.detenerMonitoreo();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
