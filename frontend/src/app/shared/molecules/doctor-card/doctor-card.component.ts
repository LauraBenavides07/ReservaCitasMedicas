import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-doctor-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doctor-card.component.html',
  styleUrls: ['./doctor-card.component.css']
})
export class DoctorCardComponent {

  @Input() doctorId: string | number = '';
  @Input() doctorName = '';
  @Input() specialty = '';
  @Input() selected = false;

  // ← AGREGAR ESTOS 4:
  @Input() scheduleStart?: string;
  @Input() scheduleEnd?: string;
  @Input() slotDuration?: number;
  @Input() activeDays?: string;

  @Output() selectDoctor = new EventEmitter<void>();

  private readonly colorPalette = [
    '#ef4444', '#3b82f6', '#8b5cf6',
    '#10b981', '#f59e0b', '#06b6d4',
  ];

  get avatarColor(): string {
    const id = this.doctorId;
    const num = typeof id === 'string' ? id.charCodeAt(id.length - 1) : id;
    return this.colorPalette[Number(num) % this.colorPalette.length];
  }

  get initials(): string {
    return this.doctorName.substring(0, 2).toUpperCase();
  }

  get hasScheduleInfo(): boolean {
    return !!(this.scheduleStart || this.scheduleEnd || this.slotDuration || this.activeDays);
  }

  formatTime(time?: string): string {
    return time ? time.slice(0, 5) : '';
  }

  onSelect(): void {
    this.selectDoctor.emit();
  }
}