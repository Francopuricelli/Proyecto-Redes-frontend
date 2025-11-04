import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss']
})
export class RegistroComponent {
  registroForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registroForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      correo: ['', [Validators.required, Validators.email]],
      nombreUsuario: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
      contraseña: ['', [Validators.required, Validators.minLength(8), this.passwordValidator]],
      repetirContraseña: ['', [Validators.required]],
      fechaNacimiento: ['', [Validators.required, this.ageValidator]],
      descripcionBreve: ['', [Validators.required, Validators.maxLength(200)]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordValidator(control: AbstractControl) {
    const value = control.value;
    if (!value) return null;
    
    const hasUppercase = /[A-Z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasMinLength = value.length >= 8;
    
    if (!hasUppercase || !hasNumber || !hasMinLength) {
      return { invalidPassword: true };
    }
    
    return null;
  }

  passwordMatchValidator(form: AbstractControl) {
    const password = form.get('contraseña');
    const confirmPassword = form.get('repetirContraseña');
    
    if (password?.value !== confirmPassword?.value) {
      confirmPassword?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  ageValidator(control: AbstractControl) {
    if (!control.value) return null;
    
    const birthDate = new Date(control.value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 13) {
      return { tooYoung: true };
    }
    
    return null;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        this.errorMessage = 'Solo se permiten archivos JPG, JPEG o PNG';
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'El archivo no puede ser mayor a 5MB';
        return;
      }
      
      this.selectedFile = file;
      this.errorMessage = '';
    }
  }

  onSubmit() {
    if (this.registroForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const formData = { ...this.registroForm.value };
      
      // Aquí normalmente subiríamos la imagen al servidor
      if (this.selectedFile) {
        formData.imagenPerfil = URL.createObjectURL(this.selectedFile);
      }
      
      this.authService.register(formData)
        .pipe(
          finalize(() => {
            // Esto SIEMPRE se ejecuta, haya error o no
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (response) => {
            // Mostrar mensaje de éxito
            Swal.fire({
              icon: 'success',
              title: '¡Registro exitoso!',
              text: 'Tu cuenta ha sido creada correctamente. ¡Bienvenido!',
              confirmButtonText: 'Continuar',
              confirmButtonColor: '#28a745'
            }).then(() => {
              this.router.navigate(['/publicaciones']);
            });
          },
          error: (error) => {
            console.error('Error de registro:', error);
            // Mostrar error con SweetAlert
            let errorMessage = 'Error al registrar usuario. Intente nuevamente.';
            
            if (error.status === 400) {
              errorMessage = 'Los datos ingresados no son válidos. Verifique la información.';
            } else if (error.status === 409) {
              errorMessage = 'El correo o nombre de usuario ya están registrados.';
            }
            
            Swal.fire({
              icon: 'error',
              title: 'Error en el registro',
              text: errorMessage,
              confirmButtonText: 'Intentar de nuevo',
              confirmButtonColor: '#dc3545'
            });
          }
      });
    } else {
      // Mostrar alerta si el formulario no es válido
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor, complete todos los campos correctamente y asegúrese de que las contraseñas coincidan.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#ffc107'
      });
      this.markFormGroupTouched();
    }
  }

  markFormGroupTouched() {
    Object.keys(this.registroForm.controls).forEach(key => {
      const control = this.registroForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.registroForm.get(fieldName);
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
      if (control.errors['pattern']) {
        return 'El nombre de usuario solo puede contener letras, números y guiones bajos';
      }
      if (control.errors['invalidPassword']) {
        return 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número';
      }
      if (control.errors['passwordMismatch']) {
        return 'Las contraseñas no coinciden';
      }
      if (control.errors['tooYoung']) {
        return 'Debe ser mayor de 13 años para registrarse';
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
      'contraseña': 'Contraseña',
      'repetirContraseña': 'Repetir contraseña',
      'fechaNacimiento': 'Fecha de nacimiento',
      'descripcionBreve': 'Descripción breve'
    };
    return labels[fieldName] || fieldName;
  }
}