import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: Date | string): string {
    if (!value) return '';

    const now = new Date();
    const date = new Date(value);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) {
      return 'justo ahora';
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }

    const days = Math.floor(hours / 24);
    if (days < 7) {
      return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
    }

    const weeks = Math.floor(days / 7);
    if (weeks < 4) {
      return `hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    }

    const months = Math.floor(days / 30);
    if (months < 12) {
      return `hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
    }

    const years = Math.floor(days / 365);
    return `hace ${years} ${years === 1 ? 'año' : 'años'}`;
  }
}
