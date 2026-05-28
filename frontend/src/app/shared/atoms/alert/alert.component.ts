import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AlertType = 'error' | 'success' | 'info' | 'warning';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css']
})
export class AlertComponent implements OnChanges {

  // Tipo de alerta: error | success | info | warning
  @Input() type: AlertType = 'info';

  // Mensaje a mostrar
  @Input() message = '';

  // Si es true, muestra un botón de cerrar (×)
  @Input() dismissible = false;

  // Controla si la alerta es visible desde el padre
  // Si el mensaje está vacío, la alerta se oculta automáticamente
  @Input() show = true;

  // Evento que emite cuando el usuario cierra la alerta
  @Output() dismissed = new EventEmitter<void>();

  // Icono por tipo
  readonly iconMap: Record<AlertType, string> = {
    error:   '✕',
    success: '✓',
    info:    'ℹ️',
    warning: '⚠️',
  };

  // Clase CSS por tipo
  alertClasses: Record<string, boolean> = {};

  get icon(): string {
    return this.iconMap[this.type];
  }

  // La alerta es visible si show=true Y hay mensaje
  get isVisible(): boolean {
    return this.show && !!this.message;
  }

  ngOnChanges(): void {
    this.alertClasses = {
      'alert':              true,
      [`alert--${this.type}`]: true,
    };
  }

  dismiss(): void {
    this.show = false;
    this.dismissed.emit();
  }
}