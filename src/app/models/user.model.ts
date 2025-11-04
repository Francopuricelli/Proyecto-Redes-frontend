export interface User {
  id?: string;
  nombre: string;
  apellido: string;
  correo: string;
  nombreUsuario: string;
  contraseña: string;
  fechaNacimiento: Date;
  descripcionBreve: string;
  imagenPerfil?: string;
  perfil: 'usuario' | 'administrador';
  fechaRegistro?: Date;
}

export interface LoginRequest {
  usuario: string; // puede ser correo o nombreUsuario
  contraseña: string;
}

export interface RegisterRequest extends Omit<User, 'id' | 'fechaRegistro'> {
  repetirContraseña: string;
}