import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appLazyLoad]',
  standalone: true
})
export class LazyLoadDirective implements OnInit {
  @Input() appLazyLoad: string = '';
  @Input() appPlaceholder: string = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"%3E%3Crect fill="%23e0e0e0" width="300" height="200"/%3E%3Ctext fill="%239e9e9e" font-family="sans-serif" font-size="20" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ECargando...%3C/text%3E%3C/svg%3E';

  private intersectionObserver?: IntersectionObserver;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    // Establecer placeholder inicial
    this.renderer.setAttribute(
      this.el.nativeElement,
      'src',
      this.appPlaceholder
    );

    // Crear IntersectionObserver
    this.intersectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage();
          this.intersectionObserver?.disconnect();
        }
      });
    });

    this.intersectionObserver.observe(this.el.nativeElement);
  }

  private loadImage() {
    const img = new Image();
    img.src = this.appLazyLoad;
    
    img.onload = () => {
      this.renderer.setAttribute(
        this.el.nativeElement,
        'src',
        this.appLazyLoad
      );
      this.renderer.addClass(this.el.nativeElement, 'lazy-loaded');
    };

    img.onerror = () => {
      // Si falla la carga, usar una imagen de error
      this.renderer.setAttribute(
        this.el.nativeElement,
        'src',
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"%3E%3Crect fill="%23f44336" width="300" height="200"/%3E%3Ctext fill="white" font-family="sans-serif" font-size="20" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EError%3C/text%3E%3C/svg%3E'
      );
    };
  }

  ngOnDestroy() {
    this.intersectionObserver?.disconnect();
  }
}
