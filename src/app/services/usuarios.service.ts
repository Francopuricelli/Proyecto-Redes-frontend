import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Usuario {
  _id: string;
  nombre: string;
  apellido: string;
  correo: string;
  nombreUsuario: string;
  fechaNacimiento: string;
  descripcionBreve: string;
  imagenPerfil?: string;
  perfil: 'usuario' | 'administrador';
  activo: boolean;
  fechaRegistro: Date;
}

export interface CrearUsuarioDto {
  nombre: string;
  apellido: string;
  correo: string;
  nombreUsuario: string;
  password: string;
  fechaNacimiento: string;
  descripcionBreve: string;
  perfil?: 'usuario' | 'administrador';
}

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  obtenerTodos(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  crear(usuario: CrearUsuarioDto): Observable<Usuario> {
    // Mapear password a contraseña para el backend
    const usuarioBackend = {
      ...usuario,
      contraseña: usuario.password
    };
    delete (usuarioBackend as any).password;
    
    return this.http.post<Usuario>(this.apiUrl, usuarioBackend);
  }

  desactivar(id: string): Observable<Usuario> {
    return this.http.delete<Usuario>(`${this.apiUrl}/${id}`);
  }

  activar(id: string): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/${id}/activar`, {});
  }
}
