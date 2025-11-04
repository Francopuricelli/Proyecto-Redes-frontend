import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';

export interface ImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ImageService {

  constructor() { }

  // Abrir selector de archivo para galería
  selectFromGallery(options?: ImageOptions): Observable<File | null> {
    return new Observable(observer => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = false;

      input.onchange = (event: any) => {
        const file = event.target.files[0];
        if (file) {
          // Validar que sea una imagen
          if (file.type.startsWith('image/')) {
            // Si hay opciones de redimensionado, aplicarlas
            if (options) {
              this.resizeImage(file, options).subscribe(resizedFile => {
                observer.next(resizedFile);
                observer.complete();
              });
            } else {
              observer.next(file);
              observer.complete();
            }
          } else {
            observer.error('El archivo seleccionado no es una imagen válida');
          }
        } else {
          observer.next(null);
          observer.complete();
        }
      };

      input.oncancel = () => {
        observer.next(null);
        observer.complete();
      };

      input.click();
    });
  }

  // Tomar foto usando la cámara
  takePhoto(options?: ImageOptions): Observable<File | null> {
    return new Observable(observer => {
      // Verificar si el dispositivo soporta getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        observer.error('La cámara no está disponible en este dispositivo');
        return;
      }

      // Crear elementos HTML para la cámara
      const modal = this.createCameraModal();
      document.body.appendChild(modal);

      const video = modal.querySelector('video') as HTMLVideoElement;
      const canvas = modal.querySelector('canvas') as HTMLCanvasElement;
      const captureBtn = modal.querySelector('#capture-btn') as HTMLButtonElement;
      const closeBtn = modal.querySelector('#close-btn') as HTMLButtonElement;

      let stream: MediaStream | null = null;

      // Iniciar la cámara
      navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: 'environment' // Cámara trasera por defecto
        } 
      })
      .then(mediaStream => {
        stream = mediaStream;
        video.srcObject = stream;
        video.play();
      })
      .catch(error => {
        this.closeCameraModal(modal, stream);
        observer.error('No se pudo acceder a la cámara: ' + error.message);
      });

      // Manejar captura de foto
      captureBtn.onclick = () => {
        const context = canvas.getContext('2d')!;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        canvas.toBlob(blob => {
          if (blob) {
            const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
            
            if (options) {
              this.resizeImage(file, options).subscribe(resizedFile => {
                this.closeCameraModal(modal, stream);
                observer.next(resizedFile);
                observer.complete();
              });
            } else {
              this.closeCameraModal(modal, stream);
              observer.next(file);
              observer.complete();
            }
          } else {
            observer.error('Error al capturar la foto');
          }
        }, 'image/jpeg', 0.9);
      };

      // Manejar cierre del modal
      closeBtn.onclick = () => {
        this.closeCameraModal(modal, stream);
        observer.next(null);
        observer.complete();
      };
    });
  }

  // Redimensionar imagen si es necesario
  private resizeImage(file: File, options: ImageOptions): Observable<File> {
    return new Observable(observer => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      img.onload = () => {
        let { width, height } = img;
        const maxWidth = options.maxWidth || 1920;
        const maxHeight = options.maxHeight || 1080;

        // Calcular nuevas dimensiones manteniendo el aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(blob => {
          if (blob) {
            const resizedFile = new File([blob], file.name, { 
              type: file.type,
              lastModified: Date.now()
            });
            observer.next(resizedFile);
            observer.complete();
          } else {
            observer.error('Error al redimensionar la imagen');
          }
        }, file.type, options.quality || 0.8);
      };

      img.onerror = () => {
        observer.error('Error al cargar la imagen');
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Crear modal para la cámara
  private createCameraModal(): HTMLElement {
    const modal = document.createElement('div');
    modal.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      ">
        <div style="
          background: white;
          padding: 20px;
          border-radius: 10px;
          max-width: 90%;
          max-height: 90%;
          display: flex;
          flex-direction: column;
          align-items: center;
        ">
          <h3 style="margin-bottom: 20px; color: #333;">Tomar Foto</h3>
          <video autoplay style="
            width: 100%;
            max-width: 400px;
            height: auto;
            border-radius: 10px;
            margin-bottom: 20px;
          "></video>
          <canvas style="display: none;"></canvas>
          <div style="display: flex; gap: 10px;">
            <button id="capture-btn" style="
              background: #28a745;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 16px;
            ">📸 Capturar</button>
            <button id="close-btn" style="
              background: #dc3545;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 16px;
            ">❌ Cancelar</button>
          </div>
        </div>
      </div>
    `;
    return modal;
  }

  // Cerrar modal de cámara y liberar recursos
  private closeCameraModal(modal: HTMLElement, stream: MediaStream | null) {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    document.body.removeChild(modal);
  }

  // Convertir File a base64 para preview
  fileToBase64(file: File): Observable<string> {
    return new Observable(observer => {
      const reader = new FileReader();
      reader.onload = () => {
        observer.next(reader.result as string);
        observer.complete();
      };
      reader.onerror = error => observer.error(error);
      reader.readAsDataURL(file);
    });
  }
}