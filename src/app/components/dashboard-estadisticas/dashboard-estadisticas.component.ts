import { Component, OnInit, inject, PLATFORM_ID, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { EstadisticasService } from '../../services/estadisticas.service';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard-estadisticas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-estadisticas.component.html',
  styleUrls: ['./dashboard-estadisticas.component.scss']
})
export class DashboardEstadisticasComponent implements OnInit {
  private estadisticasService = inject(EstadisticasService);
  private cdr = inject(ChangeDetectorRef);
  private isBrowser: boolean;

  cargando = false;
  error = '';

  // Datos para gráficos
  publicacionesPorUsuario: any[] = [];
  comentariosEnElTiempo: any[] = [];
  comentariosPorPublicacion: any[] = [];

  // Chart.js instances
  chartPublicaciones: any;
  chartComentariosTiempo: any;
  chartComentariosPublicacion: any;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  get totalComentarios(): number {
    return this.comentariosEnElTiempo.reduce((sum, c) => sum + c.totalComentarios, 0);
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.cargarEstadisticas();
    }
  }

  cargarEstadisticas() {
    this.cargando = true;
    
    // Usar forkJoin para cargar todas las estadísticas en paralelo
    forkJoin({
      publicaciones: this.estadisticasService.obtenerPublicacionesPorUsuario(),
      comentariosTiempo: this.estadisticasService.obtenerComentariosEnElTiempo(),
      comentariosPublicacion: this.estadisticasService.obtenerComentariosPorPublicacion()
    })
    .pipe(
      finalize(() => {
        this.cargando = false;
        this.cdr.detectChanges();
      })
    )
    .subscribe({
      next: (data) => {
        console.log('Estadísticas cargadas:', data);
        this.publicacionesPorUsuario = data.publicaciones;
        this.comentariosEnElTiempo = data.comentariosTiempo;
        this.comentariosPorPublicacion = data.comentariosPublicacion;
        
        this.crearGraficoPublicaciones();
        this.crearGraficoComentariosTiempo();
        this.crearGraficoComentariosPublicacion();
        
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
        this.error = 'Error al cargar estadísticas';
        this.cdr.detectChanges();
      }
    });
  }

  async crearGraficoPublicaciones() {
    if (!this.isBrowser) return;

    const Chart = (await import('chart.js/auto')).default;
    
    const ctx = document.getElementById('chartPublicaciones') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.chartPublicaciones) {
      this.chartPublicaciones.destroy();
    }

    const top10 = this.publicacionesPorUsuario.slice(0, 10);

    this.chartPublicaciones = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: top10.map(u => u.nombreUsuario),
        datasets: [{
          label: 'Publicaciones',
          data: top10.map(u => u.totalPublicaciones),
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Top 10 Usuarios por Publicaciones',
            font: {
              size: 16
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  async crearGraficoComentariosTiempo() {
    if (!this.isBrowser) return;

    const Chart = (await import('chart.js/auto')).default;
    
    const ctx = document.getElementById('chartComentariosTiempo') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.chartComentariosTiempo) {
      this.chartComentariosTiempo.destroy();
    }

    this.chartComentariosTiempo = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.comentariosEnElTiempo.map(c => new Date(c.fecha).toLocaleDateString()),
        datasets: [{
          label: 'Comentarios',
          data: this.comentariosEnElTiempo.map(c => c.totalComentarios),
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Comentarios a lo Largo del Tiempo',
            font: {
              size: 16
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  async crearGraficoComentariosPublicacion() {
    if (!this.isBrowser) return;

    const Chart = (await import('chart.js/auto')).default;
    
    const ctx = document.getElementById('chartComentariosPublicacion') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.chartComentariosPublicacion) {
      this.chartComentariosPublicacion.destroy();
    }

    const top10 = this.comentariosPorPublicacion.slice(0, 10);

    this.chartComentariosPublicacion = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: top10.map(p => `${p.nombreUsuario}: ${p.contenido.substring(0, 30)}...`),
        datasets: [{
          label: 'Comentarios',
          data: top10.map(p => p.totalComentarios),
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)',
            'rgba(199, 199, 199, 0.8)',
            'rgba(83, 102, 255, 0.8)',
            'rgba(255, 99, 255, 0.8)',
            'rgba(99, 255, 132, 0.8)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: {
                size: 10
              }
            }
          },
          title: {
            display: true,
            text: 'Top 10 Publicaciones por Comentarios',
            font: {
              size: 16
            }
          }
        }
      }
    });
  }
}
