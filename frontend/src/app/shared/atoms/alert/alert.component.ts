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

  @Input() type: AlertType = 'info';
  @Input() message = '';
  @Input() dismissible = false;
  @Input() show = true;
  @Output() dismissed = new EventEmitter<void>();

  alertClasses: Record<string, boolean> = {};

  get isVisible(): boolean {
    return this.show && !!this.message;
  }

  getIconClass(): string {
    const iconMap: Record<AlertType, string> = {
      error:   'ti ti-circle-x',
      success: 'ti ti-circle-check',
      info:    'ti ti-info-circle',
      warning: 'ti ti-alert-triangle',
    };
    return iconMap[this.type];
  }

  ngOnChanges(): void {
    this.alertClasses = {
      'alert': true,
      [`alert--${this.type}`]: true,
    };
  }

  dismiss(): void {
    this.show = false;
    this.dismissed.emit();
  }
}