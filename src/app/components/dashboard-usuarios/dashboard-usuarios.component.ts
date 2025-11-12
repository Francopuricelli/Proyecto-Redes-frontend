import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService, Usuario, CrearUsuarioDto } from '../../services/usuarios.service';
import { PublicacionService } from '../../services/publicacion.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-dashboard-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-usuarios.component.html',
  styleUrls: ['./dashboard-usuarios.component.scss']
})
export class DashboardUsuariosComponent implements OnInit {
  private usuariosService = inject(UsuariosService);
  private publicacionService = inject(PublicacionService);
  private cdr = inject(ChangeDetectorRef);

  usuarios: Usuario[] = [];
  cargando = false;
  mostrarFormulario = false;
  mostrarModalDesactivar = false;
  mostrarModalPublicaciones = false;
  usuarioADesactivar: string | null = null;
  usuarioSeleccionado: Usuario | null = null;
  publicacionesUsuario: any[] = [];
  cargandoPublicaciones = false;
  
  nuevoUsuario: CrearUsuarioDto = {
    nombre: '',
    apellido: '',
    correo: '',
    nombreUsuario: '',
    password: '',
    fechaNacimiento: '',
    descripcionBreve: '',
    perfil: 'usuario'
  };

  error = '';
  exitoMensaje = '';

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.cargando = true;
    this.usuariosService.obtenerTodos()
      .pipe(
        finalize(() => {
          this.cargando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (usuarios) => {
          console.log('Usuarios cargados:', usuarios);
          this.usuarios = usuarios;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al cargar usuarios:', error);
          this.error = 'Error al cargar la lista de usuarios';
          this.cdr.detectChanges();
        }
      });
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.resetFormulario();
    }
  }

  crearUsuario() {
    this.error = '';
    this.exitoMensaje = '';

    if (!this.validarFormulario()) {
      return;
    }

    this.cargando = true;
    this.usuariosService.crear(this.nuevoUsuario)
      .pipe(
        finalize(() => {
          this.cargando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (usuario) => {
          this.exitoMensaje = 'Usuario creado exitosamente';
          this.cargarUsuarios();
          this.toggleFormulario();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al crear usuario:', error);
          this.error = error.error?.message || 'Error al crear el usuario';
          this.cdr.detectChanges();
        }
      });
  }

  abrirModalDesactivar(id: string) {
    this.usuarioADesactivar = id;
    this.mostrarModalDesactivar = true;
  }

  cerrarModalDesactivar() {
    this.usuarioADesactivar = null;
    this.mostrarModalDesactivar = false;
  }

  confirmarDesactivar() {
    if (!this.usuarioADesactivar) return;

    this.usuariosService.desactivar(this.usuarioADesactivar).subscribe({
      next: () => {
        this.exitoMensaje = 'Usuario desactivado exitosamente';
        this.cargarUsuarios();
        this.cerrarModalDesactivar();
      },
      error: (error) => {
        console.error('Error al desactivar usuario:', error);
        this.error = 'Error al desactivar el usuario';
        this.cerrarModalDesactivar();
      }
    });
  }

  desactivarUsuario(id: string) {
    // Método deprecado, usar abrirModalDesactivar en su lugar
    this.abrirModalDesactivar(id);
  }

  activarUsuario(id: string) {
    this.usuariosService.activar(id).subscribe({
      next: () => {
        this.exitoMensaje = 'Usuario activado exitosamente';
        this.cargarUsuarios();
      },
      error: (error) => {
        console.error('Error al activar usuario:', error);
        this.error = 'Error al activar el usuario';
      }
    });
  }

  private validarFormulario(): boolean {
    if (!this.nuevoUsuario.nombre || !this.nuevoUsuario.apellido) {
      this.error = 'Nombre y apellido son obligatorios';
      return false;
    }

    if (!this.nuevoUsuario.correo || !this.nuevoUsuario.correo.includes('@')) {
      this.error = 'Correo electrónico inválido';
      return false;
    }

    if (!this.nuevoUsuario.nombreUsuario || this.nuevoUsuario.nombreUsuario.length < 3) {
      this.error = 'El nombre de usuario debe tener al menos 3 caracteres';
      return false;
    }

    if (!this.nuevoUsuario.password || this.nuevoUsuario.password.length < 8) {
      this.error = 'La contraseña debe tener al menos 8 caracteres';
      return false;
    }

    const hasUppercase = /[A-Z]/.test(this.nuevoUsuario.password);
    const hasNumber = /\d/.test(this.nuevoUsuario.password);
    
    if (!hasUppercase || !hasNumber) {
      this.error = 'La contraseña debe tener al menos una mayúscula y un número';
      return false;
    }

    if (!this.nuevoUsuario.fechaNacimiento) {
      this.error = 'La fecha de nacimiento es obligatoria';
      return false;
    }

    const birthDate = new Date(this.nuevoUsuario.fechaNacimiento);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 13) {
      this.error = 'El usuario debe ser mayor de 13 años';
      return false;
    }

    if (!this.nuevoUsuario.descripcionBreve || this.nuevoUsuario.descripcionBreve.length > 200) {
      this.error = 'La descripción breve es obligatoria y no debe superar 200 caracteres';
      return false;
    }

    return true;
  }

  private resetFormulario() {
    this.nuevoUsuario = {
      nombre: '',
      apellido: '',
      correo: '',
      nombreUsuario: '',
      password: '',
      fechaNacimiento: '',
      descripcionBreve: '',
      perfil: 'usuario'
    };
    this.error = '';
    this.exitoMensaje = '';
  }

  cerrarAlerta() {
    this.error = '';
    this.exitoMensaje = '';
  }

  verPublicaciones(usuario: Usuario) {
    this.usuarioSeleccionado = usuario;
    this.mostrarModalPublicaciones = true;
    this.cargarPublicacionesUsuario(usuario._id);
  }

  cerrarModalPublicaciones() {
    this.mostrarModalPublicaciones = false;
    this.usuarioSeleccionado = null;
    this.publicacionesUsuario = [];
  }

  cargarPublicacionesUsuario(usuarioId: string) {
    this.cargandoPublicaciones = true;
    this.publicacionService.getPublicaciones('fecha', usuarioId, 0, 50)
      .pipe(
        finalize(() => {
          this.cargandoPublicaciones = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (publicaciones) => {
          console.log('Publicaciones del usuario:', publicaciones);
          this.publicacionesUsuario = publicaciones;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al cargar publicaciones:', error);
          this.error = 'Error al cargar las publicaciones del usuario';
          this.cdr.detectChanges();
        }
      });
  }

  eliminarPublicacion(publicacionId: string) {
    if (!confirm('¿Está seguro de eliminar esta publicación?')) {
      return;
    }

    this.publicacionService.eliminarPublicacion(publicacionId).subscribe({
      next: () => {
        this.exitoMensaje = 'Publicación eliminada exitosamente';
        // Recargar publicaciones del usuario
        if (this.usuarioSeleccionado) {
          this.cargarPublicacionesUsuario(this.usuarioSeleccionado._id);
        }
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error al eliminar publicación:', error);
        this.error = 'Error al eliminar la publicación';
        this.cdr.detectChanges();
      }
    });
  }
}
