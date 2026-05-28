import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css']
})
export class CardComponent {

  // Espaciado interno de la tarjeta
  // 'none' = sin padding (para cards con header/body propios)
  // 'sm'   = 1rem    (tablas, listas compactas)
  // 'md'   = 1.5rem  (formularios - el más común)
  // 'lg'   = 2rem    (cards destacadas)
  @Input() padding: 'none' | 'sm' | 'md' | 'lg' = 'md';

  // Activa el efecto hover con sombra más pronunciada
  @Input() hoverable = false;

  // Oculta el contenido que desborde (para cards con tablas o wizards)
  @Input() overflow: 'visible' | 'hidden' = 'visible';

  get cardClasses(): Record<string, boolean> {
    return {
      'card': true,
      [`card--padding-${this.padding}`]: true,
      'card--hoverable': this.hoverable,
      'card--overflow-hidden': this.overflow === 'hidden',
    };
  }
}