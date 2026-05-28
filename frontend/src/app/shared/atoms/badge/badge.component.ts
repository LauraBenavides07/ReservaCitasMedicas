import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

// Todos los valores de status que existen en el proyecto
export type BadgeStatus =
  | 'agendada' | 'pendiente' | 'confirmada'
  | 'completada' | 'cancelada' | 'desconocido'
  // Valores en inglés (usados en doctor-dashboard)
  | 'Pendiente' | 'Confirmada' | 'Completada' | 'Cancelada';

// Dos estilos visuales del badge
export type BadgeVariant = 'outline' | 'solid';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.component.html',
  styleUrls: ['./badge.component.css']
})
export class BadgeComponent implements OnChanges {

  // El estado de la cita
  @Input() status: BadgeStatus | string = 'desconocido';

  // 'outline' = fondo claro + texto de color (appointment-list)
  // 'solid'   = fondo de color + texto blanco + punto (doctor/patient-dashboard)
  @Input() variant: BadgeVariant = 'outline';

  // Clases calculadas
  badgeClasses: Record<string, boolean> = {};

  // Texto normalizado a mostrar
  label = '';

  // Clave de estado normalizada (siempre en minúsculas)
  private statusKey = '';

  // Mapeo de status a etiqueta en español
  private readonly labelMap: Record<string, string> = {
    agendada:     'Agendada',
    pendiente:    'Pendiente',
    confirmada:   'Confirmada',
    completada:   'Completada',
    cancelada:    'Cancelada',
    desconocido:  'Desconocido',
  };

  ngOnChanges(): void {
    this.statusKey = this.status?.toLowerCase() ?? 'desconocido';
    this.label = this.labelMap[this.statusKey] ?? this.status;
    this.badgeClasses = this.buildClasses();
  }

  private buildClasses(): Record<string, boolean> {
    return {
      'badge':                           true,
      [`badge--${this.variant}`]:        true,
      [`badge--${this.statusKey}`]:      true,
    };
  }

  // El punto solo se muestra en la variante solid
  get showDot(): boolean {
    return this.variant === 'solid';
  }
}