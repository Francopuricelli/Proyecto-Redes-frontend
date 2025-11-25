import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, interval, Subscription } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly SESSION_WARNING_TIME = 10 * 60 * 1000; // 10 minutos (mostrar modal)
  private readonly TOKEN_EXPIRATION_TIME = 15 * 60 * 1000; // 15 minutos (expiración total)
  private sessionTimer: Subscription | null = null;
  private warningTimer: Subscription | null = null;
  private expirationTimer: Subscription | null = null;
  private sessionStartTime: number = Date.now();
  private modalMostrado: boolean = false;
  
  public showWarningModal$ = new Subject<boolean>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  iniciarMonitoreo(): void {
    this.sessionStartTime = Date.now();
    this.modalMostrado = false;
    this.detenerMonitoreo();

    // Timer para mostrar el modal exactamente a los 10 minutos
    this.warningTimer = interval(1000).subscribe(() => {
      const tiempoTranscurrido = Date.now() - this.sessionStartTime;

      // Mostrar modal SOLO una vez a los 10 minutos
      if (tiempoTranscurrido >= this.SESSION_WARNING_TIME && !this.modalMostrado) {
        this.modalMostrado = true;
        this.showWarningModal$.next(true);
      }
    });

    // Timer para cerrar sesión automáticamente a los 15 minutos si no se extendió
    this.expirationTimer = interval(1000).subscribe(() => {
      const tiempoTranscurrido = Date.now() - this.sessionStartTime;

      if (tiempoTranscurrido >= this.TOKEN_EXPIRATION_TIME) {
        this.cerrarSesion();
      }
    });
  }

  detenerMonitoreo(): void {
    if (this.warningTimer) {
      this.warningTimer.unsubscribe();
      this.warningTimer = null;
    }
    if (this.expirationTimer) {
      this.expirationTimer.unsubscribe();
      this.expirationTimer = null;
    }
    if (this.sessionTimer) {
      this.sessionTimer.unsubscribe();
      this.sessionTimer = null;
    }
  }

  extenderSesion(): void {
    this.authService.refrescarToken().subscribe({
      next: (response: any) => {
        console.log('Token refrescado exitosamente');
        // Reiniciar monitoreo con nuevo tiempo
        this.showWarningModal$.next(false);
        this.iniciarMonitoreo();
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
