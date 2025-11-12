import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Publicacion, Comentario } from '../models/publicacion.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PublicacionService {
  private readonly API_URL = `${environment.apiUrl}/publicaciones`;

  constructor(private http: HttpClient) {}

  getPublicaciones(ordenarPor: 'fecha' | 'likes' = 'fecha', usuarioId?: string, offset: number = 0, limit: number = 10): Observable<Publicacion[]> {
    let params: any = {
      ordenarPor,
      offset: offset.toString(),
      limit: limit.toString()
    };

    if (usuarioId) {
      params.usuarioId = usuarioId;
    }

    return this.http.get<Publicacion[]>(this.API_URL, { params });
  }

  crearPublicacion(publicacion: Omit<Publicacion, 'id' | 'fechaCreacion' | 'likes' | 'comentarios'> | FormData): Observable<Publicacion> {
    return this.http.post<Publicacion>(this.API_URL, publicacion);
  }

  darLike(publicacionId: string): Observable<Publicacion> {
    return this.http.post<Publicacion>(`${this.API_URL}/${publicacionId}/like`, {});
  }

  quitarLike(publicacionId: string): Observable<Publicacion> {
    return this.http.delete<Publicacion>(`${this.API_URL}/${publicacionId}/like`);
  }

  eliminarPublicacion(publicacionId: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${publicacionId}`);
  }

  agregarComentario(publicacionId: string, comentario: { comentario: string }): Observable<Publicacion> {
    return this.http.post<Publicacion>(`${this.API_URL}/${publicacionId}/comentarios`, comentario);
  }

  obtenerPorId(publicacionId: string): Observable<Publicacion> {
    return this.http.get<Publicacion>(`${this.API_URL}/${publicacionId}`);
  }

  obtenerComentarios(publicacionId: string, offset: number = 0, limit: number = 10): Observable<any> {
    const params = {
      offset: offset.toString(),
      limit: limit.toString()
    };
    return this.http.get<any>(`${this.API_URL}/${publicacionId}/comentarios`, { params });
  }

  editarComentario(publicacionId: string, comentarioId: string, datos: { texto: string }): Observable<Comentario> {
    return this.http.put<Comentario>(`${this.API_URL}/${publicacionId}/comentarios/${comentarioId}`, datos);
  }
}
