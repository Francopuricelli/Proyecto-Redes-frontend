import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-screen">
      <div class="spinner"></div>
      <p>Verificando sesión...</p>
    </div>
  `,
  styles: [`
    .loading-screen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.95);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 5px solid #f3f3f3;
      border-top: 5px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    p {
      margin-top: 20px;
      font-size: 18px;
      color: #666;
    }
  `]
})
export class LoadingComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Validar token al iniciar la aplicación
    const token = this.authService.getToken();
    
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    // Validar token con el backend
    this.authService.autorizar().subscribe({
      next: (user: any) => {
        console.log('Token válido, usuario:', user);
        // El token es válido, continuar
      },
      error: (error: any) => {
        console.error('Token inválido:', error);
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    });
  }
}
