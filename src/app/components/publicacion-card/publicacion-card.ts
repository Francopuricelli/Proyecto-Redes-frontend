import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Publicacion } from '../../models/publicacion.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-publicacion-card',
  imports: [CommonModule, FormsModule],
  templateUrl: './publicacion-card.html',
  styleUrl: './publicacion-card.scss'
})
export class PublicacionCardComponent {
  @Input() publicacion!: Publicacion;
  @Output() onLike = new EventEmitter<string>();
  @Output() onUnlike = new EventEmitter<string>();
  @Output() onDelete = new EventEmitter<string>();
  @Output() onComment = new EventEmitter<{ publicacionId: string, comentario: string }>();
  @Output() onClick = new EventEmitter<string>();  // ⬅️ NUEVO

  nuevoComentario: string = '';
  mostrarComentarios: boolean = false;

  constructor(private authService: AuthService) {}

  get esPublicacionPropia(): boolean {
    const usuarioActual = this.authService.getCurrentUser();
    return usuarioActual?.id === this.publicacion.autor.id;
  }

  get usuarioLeDioLike(): boolean {
    const usuarioActual = this.authService.getCurrentUser();
    if (!usuarioActual || !usuarioActual.id || !this.publicacion.likes) return false;
    return this.publicacion.likes.includes(usuarioActual.id);
  }

  toggleLike(): void {
    if (this.usuarioLeDioLike) {
      this.onUnlike.emit(this.publicacion.id);
    } else {
      this.onLike.emit(this.publicacion.id);
    }
  }

  eliminar(): void {
    this.onDelete.emit(this.publicacion.id);
  }

  agregarComentario(): void {
    if (this.nuevoComentario.trim() && this.publicacion.id) {
      this.onComment.emit({
        publicacionId: this.publicacion.id,
        comentario: this.nuevoComentario
      });
      this.nuevoComentario = '';
    }
  }

  toggleComentarios(): void {
    this.mostrarComentarios = !this.mostrarComentarios;
  }

  verDetalle(): void {
    this.onClick.emit(this.publicacion.id);
  }
}
