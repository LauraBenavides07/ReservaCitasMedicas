import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

// Todas las variantes de botón que existen en tu aplicación
type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'danger' 
  | 'success' 
  | 'warning'
  | 'outline-light'
  | 'primary-light'
  | 'view'
  | 'logout'
  | 'search';

type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.css']
})
export class ButtonComponent {
  // ==================== INPUTS ====================
  
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() disabled = false;
  @Input() fullWidth = false;
  @Input() loading = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() ariaLabel = '';
  @Input() active = false;  // Para la variante 'view' (toggle active)

  // ==================== OUTPUTS ====================
  
  @Output() clicked = new EventEmitter<void>();

  // ==================== MÉTODOS PÚBLICOS ====================

  onClick(): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit();
    }
  }

  // ==================== GETTERS PARA CLASES DINÁMICAS ====================

  get buttonClasses(): string[] {
    const classes = [
      'app-button',
      `btn-${this.variant}`,
      `btn-${this.size}`
    ];

    if (this.fullWidth) {
      classes.push('btn-full-width');
    }

    if (this.loading) {
      classes.push('btn-loading');
    }

    if (this.disabled || this.loading) {
      classes.push('btn-disabled');
    }

    if (this.active && this.variant === 'view') {
      classes.push('active');
    }

    return classes;
  }

  get accessibilityLabel(): string {
    if (this.ariaLabel) {
      return this.ariaLabel;
    }
    return '';
  }
}