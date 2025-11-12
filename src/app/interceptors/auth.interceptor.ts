import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor de autenticación HTTP.
 * 
 * Este interceptor se ejecuta AUTOMÁTICAMENTE en todas las peticiones HTTP que hace la aplicación.
 * Su función principal es:
 * 1. Agregar el token JWT a las cabeceras de cada petición (Authorization: Bearer <token>)
 * 2. Manejar errores 401 (no autorizado) redirigiendo al login
 * 
 * Ventajas de usar un interceptor:
 * - No necesitas agregar manualmente el token en cada servicio
 * - Centraliza la lógica de autenticación en un solo lugar
 * - Maneja automáticamente la expiración de tokens
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Inyecta servicios necesarios usando la nueva sintaxis funcional de Angular
  const router = inject(Router);
  const authService = inject(AuthService);
  const platformId = inject(PLATFORM_ID);

  // Clona la petición original (las peticiones HTTP son inmutables)
  let clonedReq = req;
  
  // Solo accede a localStorage si estamos en el navegador (no en el servidor SSR)
  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('access_token');
    
    // Si existe un token, clona la petición agregando la cabecera de autorización
    if (token) {
      clonedReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}` // Formato estándar JWT
        }
      });
    }
  }

  // Continúa con la petición y maneja posibles errores
  return next(clonedReq).pipe(
    catchError((error) => {
      // Si el servidor responde 401 (no autorizado), el token es inválido o expiró
      if (error.status === 401) {
        // Limpia el token y datos del usuario
        authService.logout();
        // Redirige al login
        router.navigate(['/login']);
      }
      // Re-lanza el error para que el servicio que hizo la petición pueda manejarlo
      return throwError(() => error);
    })
  );
};
