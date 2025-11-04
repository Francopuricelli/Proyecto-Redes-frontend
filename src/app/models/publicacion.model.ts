export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  nombreUsuario: string;
  email: string;
  imagenPerfil?: string;
}

export interface Publicacion {
  id?: string;
  titulo: string;
  contenido: string;
  imagen?: string;
  autor: Usuario; // Objeto usuario populado desde backend
  fechaCreacion: Date;
  fecha: Date; // Alias para fechaCreacion
  likes: string[]; // Array de IDs de usuarios que dieron like
  cantidadLikes?: number; // Conteo de likes desde backend
  comentarios: Comentario[];
  eliminada?: boolean;
}

export interface Comentario {
  id?: string;
  comentario: string;
  autor: Usuario; // Objeto usuario populado desde backend
  fecha: Date;
}