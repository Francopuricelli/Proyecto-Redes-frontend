import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PublicacionService } from '../../services/publicacion.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-detalle-publicacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detalle-publicacion.component.html',
  styleUrls: ['./detalle-publicacion.component.css']
})
export class DetallePublicacionComponent implements OnInit {
  publicacion: any = null;
  comentarios: any[] = [];
  nuevoComentario: string = '';
  comentarioEditando: string | null = null;
  textoEditado: string = '';
  offset: number = 0;
  limit: number = 10;
  totalComentarios: number = 0;
  cargando: boolean = false;
  cargandoComentarios: boolean = false;
  errorMessage: string = '';
  usuarioActual: any = null;
  avatarError: boolean = false;
  imagenPublicacionError: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private publicacionService: PublicacionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Obtener usuario actual del localStorage
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.usuarioActual = { id: payload.sub };
    }

    // Obtener ID de la publicación desde la ruta
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarPublicacion(id);
      this.cargarComentarios(id);
    }
  }

  cargarPublicacion(id: string): void {
    this.cargando = true;
    this.errorMessage = '';
    this.avatarError = false;
    this.imagenPublicacionError = false;
    this.publicacionService.obtenerPorId(id)
      .pipe(
        finalize(() => {
          this.cargando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data: any) => {
          console.log('Publicación cargada:', data);
          console.log('Autor de la publicación:', data.autor);
          console.log('Todas las propiedades del autor:', Object.keys(data.autor || {}));
          console.log('Autor completo stringificado:', JSON.stringify(data.autor, null, 2));
          console.log('Imagen de perfil:', data.autor?.imagenPerfil);
          console.log('Nombre de usuario:', data.autor?.nombreUsuario);
          console.log('Imagen de publicación:', data.imagen);
          this.publicacion = data;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('Error al cargar publicación:', error);
          this.errorMessage = 'No se pudo cargar la publicación';
          this.cdr.detectChanges();
        }
      });
  }

  cargarComentarios(id: string, cargarMas: boolean = false): void {
    this.cargandoComentarios = true;
    this.publicacionService.obtenerComentarios(id, this.offset, this.limit)
      .pipe(
        finalize(() => {
          this.cargandoComentarios = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data: any) => {
          if (cargarMas) {
            // Agregar nuevos comentarios a los existentes
            this.comentarios = [...this.comentarios, ...data.comentarios];
          } else {
            // Reemplazar comentarios (primera carga)
            this.comentarios = data.comentarios;
          }
          this.totalComentarios = data.total;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('Error al cargar comentarios:', error);
          this.errorMessage = 'No se pudieron cargar los comentarios';
          this.cdr.detectChanges();
        }
      });
  }

  cargarMasComentarios(): void {
    if (this.publicacion) {
      this.offset += this.limit;
      this.cargarComentarios(this.publicacion.id, true);
    }
  }

  hayMasComentarios(): boolean {
    return this.comentarios.length < this.totalComentarios;
  }

  agregarComentario(): void {
    if (!this.nuevoComentario.trim() || !this.publicacion) {
      return;
    }

    this.publicacionService.agregarComentario(this.publicacion.id, { comentario: this.nuevoComentario }).subscribe({
      next: () => {
        this.nuevoComentario = '';
        this.offset = 0;
        this.cargarComentarios(this.publicacion.id);
        this.cdr.detectChanges(); // Forzar detección de cambios
      },
      error: (error: any) => {
        console.error('Error al agregar comentario:', error);
        this.errorMessage = 'No se pudo agregar el comentario';
        this.cdr.detectChanges(); // Forzar detección de cambios en error
      }
    });
  }

  iniciarEdicion(comentario: any): void {
    this.comentarioEditando = comentario.id;
    this.textoEditado = comentario.comentario;
  }

  cancelarEdicion(): void {
    this.comentarioEditando = null;
    this.textoEditado = '';
  }

  guardarEdicion(comentarioId: string): void {
    if (!this.textoEditado.trim() || !this.publicacion) {
      return;
    }

    this.publicacionService.editarComentario(this.publicacion.id, comentarioId, { texto: this.textoEditado }).subscribe({
      next: (comentarioActualizado: any) => {
        // Actualizar el comentario en la lista
        const index = this.comentarios.findIndex(c => c.id === comentarioId);
        if (index !== -1) {
          this.comentarios[index] = comentarioActualizado;
        }
        this.cancelarEdicion();
        this.cdr.detectChanges(); // Forzar detección de cambios
      },
      error: (error: any) => {
        console.error('Error al editar comentario:', error);
        this.errorMessage = 'No se pudo editar el comentario';
        this.cdr.detectChanges(); // Forzar detección de cambios en error
      }
    });
  }

  esAutorComentario(comentario: any): boolean {
    return this.usuarioActual && comentario.autor && comentario.autor.id === this.usuarioActual.id;
  }

  volver(): void {
    this.router.navigate(['/publicaciones']);
  }

  darLike(): void {
    if (!this.publicacion) return;

    this.publicacionService.darLike(this.publicacion.id).subscribe({
      next: (publicacionActualizada: any) => {
        this.publicacion = publicacionActualizada;
        this.cdr.detectChanges(); // Forzar detección de cambios
      },
      error: (error: any) => {
        console.error('Error al dar like:', error);
      }
    });
  }

  quitarLike(): void {
    if (!this.publicacion) return;

    this.publicacionService.quitarLike(this.publicacion.id).subscribe({
      next: (publicacionActualizada: any) => {
        this.publicacion = publicacionActualizada;
        this.cdr.detectChanges(); // Forzar detección de cambios
      },
      error: (error: any) => {
        console.error('Error al quitar like:', error);
      }
    });
  }

  usuarioDioLike(): boolean {
    if (!this.publicacion || !this.usuarioActual) return false;
    return this.publicacion.likes?.includes(this.usuarioActual.id) || false;
  }

  onAvatarError(event: any): void {
    if (!this.avatarError) {
      this.avatarError = true;
      event.target.src = 'https://ui-avatars.com/api/?name=' + (this.publicacion?.autor?.nombreUsuario || 'U') + '&background=007bff&color=fff&size=50';
    }
  }

  onImagenPublicacionError(event: any): void {
    if (!this.imagenPublicacionError) {
      this.imagenPublicacionError = true;
      event.target.style.display = 'none';
    }
  }

  getAvatarUrl(): string {
    console.log('getAvatarUrl llamado');
    console.log('avatarError:', this.avatarError);
    console.log('publicacion:', this.publicacion);
    console.log('autor:', this.publicacion?.autor);
    console.log('imagenPerfil:', this.publicacion?.autor?.imagenPerfil);
    console.log('nombreUsuario:', this.publicacion?.autor?.nombreUsuario);
    
    if (this.avatarError) {
      return 'https://ui-avatars.com/api/?name=' + (this.publicacion?.autor?.nombreUsuario || 'U') + '&background=007bff&color=fff&size=50';
    }
    return this.publicacion?.autor?.imagenPerfil || 'https://ui-avatars.com/api/?name=' + (this.publicacion?.autor?.nombreUsuario || 'U') + '&background=007bff&color=fff&size=50';
  }
}
