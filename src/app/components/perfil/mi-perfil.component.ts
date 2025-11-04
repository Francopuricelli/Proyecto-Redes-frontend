import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PublicacionService } from '../../services/publicacion.service';
import { UserService } from '../../services/user.service';
import { ThemeService } from '../../services/theme.service';
import { User } from '../../models/user.model';
import { Publicacion } from '../../models/publicacion.model';
import { PublicacionCardComponent } from '../publicacion-card/publicacion-card';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, PublicacionCardComponent],
  templateUrl: './mi-perfil.component.html',
  styleUrls: ['./mi-perfil.component.scss']
})
export class MiPerfilComponent implements OnInit {
  currentUser: User | null = null;
  perfilForm: FormGroup;
  isEditing = false;
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  misPublicaciones: Publicacion[] = [];
  cargandoPublicaciones = false;
  
  // Paginación y ordenamiento para publicaciones
  ordenarPor: 'fecha' | 'likes' = 'fecha';
  offset: number = 0;
  limit: number = 10;
  hayMasPublicaciones: boolean = true;
  cargandoMas: boolean = false;
  
  // Modal de eliminación
  mostrarModalEliminar = false;
  publicacionAEliminar: string | null = null;
  
  // Imagen de perfil
  selectedImageFile: File | null = null;
  imagePreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private publicacionService: PublicacionService,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public themeService: ThemeService
  ) {
    this.perfilForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      correo: ['', [Validators.required, Validators.email]],
      nombreUsuario: ['', [Validators.required, Validators.minLength(3)]],
      fechaNacimiento: ['', [Validators.required]],
      descripcionBreve: ['', [Validators.required, Validators.maxLength(200)]]
    });
  }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadUserData();
    this.cargarMisPublicaciones();
  }

  cargarMisPublicaciones(reset: boolean = true) {
    if (!this.currentUser?.id) {
      console.error('No hay usuario autenticado');
      return;
    }
    
    if (reset) {
      this.offset = 0;
      this.misPublicaciones = [];
    }
    
    this.cargandoPublicaciones = true;

    console.log('Cargando publicaciones del usuario:', this.currentUser.id);
    console.log('Parámetros:', { ordenarPor: this.ordenarPor, offset: this.offset, limit: this.limit });
    
    this.publicacionService.getPublicaciones(this.ordenarPor, this.currentUser.id, this.offset, this.limit)
      .pipe(
        finalize(() => {
          this.cargandoPublicaciones = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (publicaciones) => {
          console.log('Publicaciones recibidas:', publicaciones);
          this.misPublicaciones = [...this.misPublicaciones, ...publicaciones];
          this.hayMasPublicaciones = publicaciones.length === this.limit;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al cargar publicaciones:', error);
        }
      });
  }

  cambiarOrden(orden: 'fecha' | 'likes') {
    this.ordenarPor = orden;
    this.cargarMisPublicaciones(true);
  }

  cargarMasPublicaciones() {
    if (this.cargandoMas || !this.hayMasPublicaciones) return;
    
    this.cargandoMas = true;
    this.offset += this.limit;
    
    this.publicacionService.getPublicaciones(this.ordenarPor, this.currentUser!.id, this.offset, this.limit)
      .pipe(
        finalize(() => {
          this.cargandoMas = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (publicaciones) => {
          this.misPublicaciones = [...this.misPublicaciones, ...publicaciones];
          this.hayMasPublicaciones = publicaciones.length === this.limit;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al cargar más publicaciones:', error);
          this.offset -= this.limit; // Revertir el offset
        }
      });
  }

  loadUserData() {
    if (this.currentUser) {
      this.perfilForm.patchValue({
        nombre: this.currentUser.nombre,
        apellido: this.currentUser.apellido,
        correo: this.currentUser.correo,
        nombreUsuario: this.currentUser.nombreUsuario,
        fechaNacimiento: new Date(this.currentUser.fechaNacimiento).toISOString().split('T')[0],
        descripcionBreve: this.currentUser.descripcionBreve
      });
    }
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    this.successMessage = '';
    this.errorMessage = '';
    
    if (!this.isEditing) {
      // Si cancela la edición, restaurar los datos originales
      this.loadUserData();
    }
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedImageFile = input.files[0];
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(this.selectedImageFile);
    }
  }

  onSubmit() {
    if (this.perfilForm.valid && this.currentUser) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const formData = new FormData();
      formData.append('nombre', this.perfilForm.value.nombre);
      formData.append('apellido', this.perfilForm.value.apellido);
      formData.append('correo', this.perfilForm.value.correo);
      formData.append('nombreUsuario', this.perfilForm.value.nombreUsuario);
      formData.append('fechaNacimiento', this.perfilForm.value.fechaNacimiento);
      formData.append('descripcionBreve', this.perfilForm.value.descripcionBreve);
      
      if (this.selectedImageFile) {
        formData.append('imagenPerfil', this.selectedImageFile);
      }
      
      this.userService.updateProfile(formData).subscribe({
        next: (updatedUser) => {
          console.log('Perfil actualizado, usuario recibido:', updatedUser);
          // Actualizar usuario en localStorage y en memoria
          this.authService.updateCurrentUser(updatedUser);
          this.currentUser = updatedUser;
          
          // Recargar los datos del usuario desde el servidor
          this.userService.getProfile().subscribe({
            next: (user) => {
              console.log('Usuario recargado desde el servidor:', user);
              this.currentUser = user;
              this.authService.updateCurrentUser(user);
              this.loadUserData();
              this.cdr.detectChanges();
            }
          });
          
          this.isLoading = false;
          this.isEditing = false;
          this.selectedImageFile = null;
          this.imagePreview = null;
          this.successMessage = 'Perfil actualizado exitosamente';
          
          setTimeout(() => {
            this.successMessage = '';
            this.cdr.detectChanges();
          }, 3000);
        },
        error: (error) => {
          console.error('Error al actualizar perfil:', error);
          console.error('Error completo:', JSON.stringify(error, null, 2));
          this.isLoading = false;
          this.errorMessage = error.error?.message || error.message || 'Error al actualizar el perfil';
          
          setTimeout(() => {
            this.errorMessage = '';
          }, 3000);
        }
      });
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  calculateAge(): number {
    if (!this.currentUser?.fechaNacimiento) return 0;
    
    const birthDate = new Date(this.currentUser.fechaNacimiento);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.perfilForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${this.getFieldLabel(fieldName)} es requerido`;
      }
      if (control.errors['minlength']) {
        const requiredLength = control.errors['minlength'].requiredLength;
        return `${this.getFieldLabel(fieldName)} debe tener al menos ${requiredLength} caracteres`;
      }
      if (control.errors['maxlength']) {
        const maxLength = control.errors['maxlength'].requiredLength;
        return `${this.getFieldLabel(fieldName)} no puede exceder ${maxLength} caracteres`;
      }
      if (control.errors['email']) {
        return 'Ingrese un correo electrónico válido';
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'nombre': 'Nombre',
      'apellido': 'Apellido',
      'correo': 'Correo electrónico',
      'nombreUsuario': 'Nombre de usuario',
      'fechaNacimiento': 'Fecha de nacimiento',
      'descripcionBreve': 'Descripción breve'
    };
    return labels[fieldName] || fieldName;
  }

  // Manejadores de eventos del publicacion-card
  handleLike(publicacionId: string) {
    this.publicacionService.darLike(publicacionId).subscribe({
      next: () => {
        const index = this.misPublicaciones.findIndex(p => p.id === publicacionId);
        if (index !== -1 && this.currentUser?.id) {
          this.misPublicaciones[index].likes.push(this.currentUser.id);
          if (this.misPublicaciones[index].cantidadLikes !== undefined) {
            this.misPublicaciones[index].cantidadLikes!++;
          }
        }
      },
      error: (error) => {
        console.error('Error al dar like:', error);
      }
    });
  }

  handleUnlike(publicacionId: string) {
    this.publicacionService.quitarLike(publicacionId).subscribe({
      next: () => {
        const index = this.misPublicaciones.findIndex(p => p.id === publicacionId);
        if (index !== -1 && this.currentUser?.id) {
          this.misPublicaciones[index].likes = this.misPublicaciones[index].likes.filter(
            id => id !== this.currentUser!.id
          );
          if (this.misPublicaciones[index].cantidadLikes !== undefined) {
            this.misPublicaciones[index].cantidadLikes!--;
          }
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
        this.misPublicaciones = this.misPublicaciones.filter(p => p.id !== this.publicacionAEliminar);
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
        const index = this.misPublicaciones.findIndex(p => p.id === event.publicacionId);
        if (index !== -1) {
          // Actualizar solo los comentarios sin reemplazar toda la publicación
          this.misPublicaciones[index].comentarios = publicacionActualizada.comentarios;
          this.cdr.detectChanges(); // Forzar detección de cambios
        }
      },
      error: (error) => {
        console.error('Error al agregar comentario:', error);
      }
    });
  }
}