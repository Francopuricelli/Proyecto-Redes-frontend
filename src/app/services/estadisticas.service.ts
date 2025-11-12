import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PublicacionesPorUsuario {
  nombreUsuario: string;
  nombre: string;
  totalPublicaciones: number;
}

export interface ComentariosEnElTiempo {
  fecha: Date;
  totalComentarios: number;
}

export interface ComentariosPorPublicacion {
  _id: string;
  contenido: string;
  nombreUsuario: string;
  totalComentarios: number;
}

@Injectable({
  providedIn: 'root'
})
export class EstadisticasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/estadisticas`;

  obtenerPublicacionesPorUsuario(): Observable<PublicacionesPorUsuario[]> {
    return this.http.get<PublicacionesPorUsuario[]>(
      `${this.apiUrl}/publicaciones-por-usuario`
    );
  }

  obtenerComentariosEnElTiempo(): Observable<ComentariosEnElTiempo[]> {
    return this.http.get<ComentariosEnElTiempo[]>(
      `${this.apiUrl}/comentarios-en-el-tiempo`
    );
  }

  obtenerComentariosPorPublicacion(): Observable<ComentariosPorPublicacion[]> {
    return this.http.get<ComentariosPorPublicacion[]>(
      `${this.apiUrl}/comentarios-por-publicacion`
    );
  }
}
