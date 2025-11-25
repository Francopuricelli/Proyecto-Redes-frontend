import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SessionService } from '../../services/session.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-session-modal',
  standalone: true,
  imports: [CommonModule],
  template: '',
  styles: []
})
export class SessionModalComponent implements OnInit, OnDestroy {
  private subscription: Subscription | null = null;

  constructor(private sessionService: SessionService) {}

  ngOnInit(): void {
    this.subscription = this.sessionService.showWarningModal$.subscribe(show => {
      if (show) {
        Swal.fire({
          title: '⚠️ Advertencia de Sesión',
          html: '<p><strong>Tu sesión expirará en 5 minutos</strong></p><p>¿Deseas extender tu sesión?</p>',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, extender sesión',
          cancelButtonText: 'No, cerrar sesión',
          confirmButtonColor: '#28a745',
          cancelButtonColor: '#dc3545',
          allowOutsideClick: false,
          allowEscapeKey: false
        }).then((result) => {
          if (result.isConfirmed) {
            this.extenderSesion();
          } else {
            this.cerrarSesion();
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  extenderSesion(): void {
    this.sessionService.extenderSesion();
  }

  cerrarSesion(): void {
    this.sessionService.cerrarSesion();
  }
}
