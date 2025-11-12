import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[appClickOutside]',
  standalone: true
})
export class ClickOutsideDirective {
  @Output() appClickOutside = new EventEmitter<void>();

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event.target'])
  public onClick(target: EventTarget | null): void {
    if (!target) return;
    
    const clickedInside = this.elementRef.nativeElement.contains(target as Node);
    if (!clickedInside) {
      this.appClickOutside.emit();
    }
  }
}
