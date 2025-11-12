import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-session-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="mostrarModal" class="modal-overlay">
      <div class="modal">
        <h2>⚠️ Advertencia de Sesión</h2>
        <p>Tu sesión está por expirar. ¿Qué deseas hacer?</p>
        <div class="modal-buttons">
          <button class="btn-extender" (click)="extenderSesion()">
            Extender Sesión
          </button>
          <button class="btn-cerrar" (click)="cerrarSesion()">
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    }

    .modal {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 5px 20px rgba(0,0,0,0.3);
      max-width: 400px;
      text-align: center;
    }

    h2 {
      margin-top: 0;
      color: #ff9800;
      font-size: 24px;
    }

    p {
      margin: 20px 0;
      font-size: 16px;
      color: #555;
    }

    .modal-buttons {
      display: flex;
      gap: 15px;
      justify-content: center;
    }

    .btn-extender,
    .btn-cerrar {
      padding: 12px 24px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.3s;
    }

    .btn-extender {
      background: #28a745;
      color: white;
    }

    .btn-extender:hover {
      background: #218838;
    }

    .btn-cerrar {
      background: #dc3545;
      color: white;
    }

    .btn-cerrar:hover {
      background: #c82333;
    }
  `]
})
export class SessionModalComponent implements OnInit, OnDestroy {
  mostrarModal = false;
  private subscription: Subscription | null = null;

  constructor(private sessionService: SessionService) {}

  ngOnInit(): void {
    this.subscription = this.sessionService.showWarningModal$.subscribe(show => {
      this.mostrarModal = show;
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
