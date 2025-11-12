import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { PublicacionService } from '../../services/publicacion.service';
import { AuthService } from '../../services/auth.service';
import { ImageService } from '../../services/image.service';
import { ThemeService } from '../../services/theme.service';
import { Publicacion, Comentario } from '../../models/publicacion.model';
import { User } from '../../models/user.model';
import { PublicacionCardComponent } from '../publicacion-card/publicacion-card';
import Swal from 'sweetalert2';
import { finalize } from 'rxjs';

/**
 * Componente principal de publicaciones.
 * 
 * Responsabilidades:
 * - Mostrar el feed de publicaciones
 * - Crear nuevas publicaciones con imágenes
 * - Manejar likes, comentarios y eliminaciones
 * - Ordenar publicaciones por fecha o likes
 * - Gestionar paginación (carga de más publicaciones)
 */
@Component({
  selector: 'app-publicaciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, PublicacionCardComponent],
  templateUrl: './publicaciones.component.html',
  styleUrls: ['./publicaciones.component.scss']
})
export class PublicacionesComponent implements OnInit {
  // Array de publicaciones que se muestra en el feed
  publicaciones: Publicacion[] = [];
  
  // Formulario reactivo para crear nuevas publicaciones
  nuevaPublicacionForm: FormGroup;
  
  // Usuario actual autenticado
  currentUser: User | null = null;
  
  // Estados de UI
  isCreatingPost = false; // Indica si se está creando una publicación
  showNewPostForm = false; // Controla si se muestra el formulario de nueva publicación
  selectedImageFile: File | null = null; // Archivo de imagen seleccionado
  imagePreview: string | null = null; // URL de vista previa de la imagen
  
  // ========== PAGINACIÓN Y ORDENAMIENTO ==========
  ordenarPor: 'fecha' | 'likes' = 'fecha'; // Criterio de ordenamiento
  offset: number = 0; // Desde qué publicación cargar (para paginación)
  limit: number = 10; // Cuántas publicaciones cargar por vez
  hayMasPublicaciones: boolean = true; // Indica si hay más publicaciones para cargar
  cargandoMas: boolean = false; // Indica si se están cargando más publicaciones
  
  // ========== MODAL DE ELIMINACIÓN ==========
  mostrarModalEliminar = false; // Controla si se muestra el modal de confirmación
  publicacionAEliminar: string | null = null; // ID de la publicación a eliminar
  
  // Mensajes de feedback
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder, // Para crear formularios reactivos
    private publicacionService: PublicacionService, // Servicio para operaciones con publicaciones
    public authService: AuthService, // Servicio de autenticación
    private imageService: ImageService, // Servicio para manejar imágenes
    private cdr: ChangeDetectorRef, // Para forzar detección de cambios en Angular
    public themeService: ThemeService, // Servicio para tema claro/oscuro
    private router: Router // Para navegación
  ) {
    // Inicializa el formulario con validaciones
    this.nuevaPublicacionForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(1)]],
      contenido: ['', [Validators.required, Validators.minLength(1)]],
      imagen: [''] // Opcional
    });
  }

  /**
   * Hook de inicialización de Angular.
   * Se ejecuta cuando el componente se crea.
   */
  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.cargarPublicaciones();
  }

  /**
   * Carga las publicaciones desde el backend.
   * @param reset - Si es true, reinicia la paginación y limpia publicaciones existentes
   */
  cargarPublicaciones(reset: boolean = true) {
    if (reset) {
      this.offset = 0;
      this.publicaciones = [];
    }

    // Llama al servicio para obtener publicaciones
    // finalize() se ejecuta al terminar (éxito o error)
    this.publicacionService.getPublicaciones(this.ordenarPor, undefined, this.offset, 100)
      .pipe(
        finalize(() => {
          // Fuerza a Angular a detectar cambios en la vista
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (publicaciones) => {
          console.log('Publicaciones cargadas:', publicaciones);
          // Agrega las nuevas publicaciones al array existente
          this.publicaciones = [...this.publicaciones, ...publicaciones];
          // Si se obtuvieron 100, probablemente hay más
          this.hayMasPublicaciones = publicaciones.length === 100;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al cargar publicaciones:', error);
        }
      });
  }

  /**
   * Cambia el criterio de ordenamiento de las publicaciones.
   * @param orden - 'fecha' para ordenar por más recientes, 'likes' para más populares
   */
  cambiarOrden(orden: 'fecha' | 'likes') {
    this.ordenarPor = orden;
    this.cargarPublicaciones(true); // Recarga desde el inicio
  }

  /**
   * Carga más publicaciones cuando el usuario hace scroll o click en "Cargar más".
   * Implementa paginación.
   */
  cargarMasPublicaciones() {
    if (this.cargandoMas || !this.hayMasPublicaciones) return;
    
    this.cargandoMas = true;
    this.offset += this.limit; // Incrementa el offset para obtener las siguientes
    
    this.publicacionService.getPublicaciones(this.ordenarPor, undefined, this.offset, this.limit)
      .pipe(finalize(() => this.cargandoMas = false))
      .subscribe({
        next: (publicaciones) => {
          this.publicaciones = [...this.publicaciones, ...publicaciones];
          this.hayMasPublicaciones = publicaciones.length === this.limit;
        },
        error: (error) => {
          console.error('Error al cargar más publicaciones:', error);
          this.offset -= this.limit; // Revertir el offset
        }
      });
  }

  toggleNewPostForm() {
    this.showNewPostForm = !this.showNewPostForm;
    if (!this.showNewPostForm) {
      this.nuevaPublicacionForm.reset();
      this.clearImage();
    }
  }

  // Seleccionar imagen desde galería
  selectFromGallery() {
    this.imageService.selectFromGallery({ 
      maxWidth: 1920, 
      maxHeight: 1080, 
      quality: 0.8 
    }).subscribe({
      next: (file) => {
        if (file) {
          this.handleSelectedImage(file);
        }
      },
      error: (error) => {
        console.error('Error al seleccionar imagen:', error);
      }
    });
  }

  // Tomar foto con la cámara
  takePhoto() {
    this.imageService.takePhoto({ 
      maxWidth: 1920, 
      maxHeight: 1080, 
      quality: 0.8 
    }).subscribe({
      next: (file) => {
        if (file) {
          this.handleSelectedImage(file);
        }
      },
      error: (error) => {
        console.error('Error al acceder a la cámara:', error);
      }
    });
  }

  // Manejar imagen seleccionada
  private handleSelectedImage(file: File) {
    this.selectedImageFile = file;
    
    // Crear preview
    this.imageService.fileToBase64(file).subscribe({
      next: (base64) => {
        this.imagePreview = base64;
      },
      error: (error) => {
        console.error('Error al crear preview:', error);
      }
    });
  }

  // Limpiar imagen seleccionada
  clearImage() {
    this.selectedImageFile = null;
    this.imagePreview = null;
  }

  // Mostrar opciones de imagen
  showImageOptions() {
    Swal.fire({
      title: 'Agregar Imagen',
      text: 'Selecciona una opción:',
      icon: 'question',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: '📱 Tomar Foto',
      denyButtonText: '🖼️ Desde Galería',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      denyButtonColor: '#007bff',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.takePhoto();
      } else if (result.isDenied) {
        this.selectFromGallery();
      }
    });
  }

  crearPublicacion() {
    if (this.nuevaPublicacionForm.valid && this.currentUser) {
      this.isCreatingPost = true;
      
      // Crear FormData para enviar archivo de imagen
      const formData = new FormData();
      formData.append('titulo', this.nuevaPublicacionForm.value.titulo);
      formData.append('contenido', this.nuevaPublicacionForm.value.contenido);
      formData.append('autor', this.currentUser.id!);
      
      // Agregar imagen si existe
      if (this.selectedImageFile) {
        formData.append('imagen', this.selectedImageFile, this.selectedImageFile.name);
      }

      this.publicacionService.crearPublicacion(formData)
        .pipe(
          finalize(() => {
            this.isCreatingPost = false;
            this.cdr.detectChanges();
          })
        )
        .subscribe({
          next: (publicacion) => {
            console.log('Publicación creada:', publicacion);
            // Recargar publicaciones para asegurar sincronización
            this.cargarPublicaciones(true);
            this.nuevaPublicacionForm.reset();
            this.clearImage();
            this.showNewPostForm = false;
          },
          error: (error) => {
            console.error('Error al crear publicación:', error);
            alert('No se pudo crear la publicación. Intenta nuevamente.');
          }
        });
    }
  }

  // Manejadores de eventos del publicacion-card
  verDetallePublicacion(publicacionId: string) {
    this.router.navigate(['/publicaciones', publicacionId]);
  }

  handleLike(publicacionId: string) {
    this.publicacionService.darLike(publicacionId).subscribe({
      next: (publicacionActualizada) => {
        // Actualizar la publicación completa con la respuesta del backend
        const index = this.publicaciones.findIndex(p => p.id === publicacionId);
        if (index !== -1) {
          // Actualizar con los datos del backend
          this.publicaciones[index] = {
            ...this.publicaciones[index],
            likes: publicacionActualizada.likes || [],
            cantidadLikes: publicacionActualizada.likes?.length || 0
          };
          // Forzar detección de cambios
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error al dar like:', error);
      }
    });
  }

  handleUnlike(publicacionId: string) {
    this.publicacionService.quitarLike(publicacionId).subscribe({
      next: (publicacionActualizada) => {
        // Actualizar la publicación completa con la respuesta del backend
        const index = this.publicaciones.findIndex(p => p.id === publicacionId);
        if (index !== -1) {
          // Actualizar con los datos del backend
          this.publicaciones[index] = {
            ...this.publicaciones[index],
            likes: publicacionActualizada.likes || [],
            cantidadLikes: publicacionActualizada.likes?.length || 0
          };
          // Forzar detección de cambios
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error al quitar like:', error);
      }
    });
  }

  handleDelete(publicacionId: string) {
    this.publicacionAEliminar = publicacionId;
    this.mostrarModalEliminar = true;
  }

  cancelarEliminacion() {
    this.mostrarModalEliminar = false;
    this.publicacionAEliminar = null;
  }

  confirmarEliminacion() {
    if (!this.publicacionAEliminar) return;

    this.publicacionService.eliminarPublicacion(this.publicacionAEliminar).subscribe({
      next: () => {
        this.publicaciones = this.publicaciones.filter(p => p.id !== this.publicacionAEliminar);
        this.mostrarModalEliminar = false;
        this.publicacionAEliminar = null;
        this.successMessage = 'Publicación eliminada correctamente';
        this.cdr.detectChanges();
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (error) => {
        console.error('Error al eliminar publicación:', error);
        this.errorMessage = 'No se pudo eliminar la publicación';
        this.mostrarModalEliminar = false;
        this.publicacionAEliminar = null;
        this.cdr.detectChanges();
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => {
          this.errorMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      }
    });
  }

  handleComment(event: { publicacionId: string, comentario: string }) {
    this.publicacionService.agregarComentario(event.publicacionId, { comentario: event.comentario }).subscribe({
      next: (publicacionActualizada) => {
        const index = this.publicaciones.findIndex(p => p.id === event.publicacionId);
        if (index !== -1) {
          // Actualizar solo los comentarios sin reemplazar toda la publicación
          this.publicaciones[index].comentarios = publicacionActualizada.comentarios;
          this.cdr.detectChanges(); // Forzar detección de cambios
        }
      },
      error: (error) => {
        console.error('Error al agregar comentario:', error);
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }
}