import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Appointment } from './appointment.entity';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, nullable: true })
  specialty: string;

  @Column({ name: 'schedule_start', type: 'time', default: '08:00' })
  scheduleStart: string;

  @Column({ name: 'schedule_end', type: 'time', default: '18:00' })
  scheduleEnd: string;

  @Column({ name: 'slot_duration', default: 30 })
  slotDuration: number;

  @Column({ name: 'lunch_start', type: 'time', nullable: true })
  lunchStart: string;

  @Column({ name: 'lunch_end', type: 'time', nullable: true })
  lunchEnd: string;

  @Column({ name: 'active_days', length: 50, default: '1,2,3,4,5' })
  activeDays: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Appointment, (appointment) => appointment.doctor)
  appointments: Appointment[];

  getWorkingDays(): number[] {
    return this.activeDays
      ? this.activeDays.split(',').map(Number)
      : [1, 2, 3, 4, 5];
  }

  isWorkingDay(dateStr: string): boolean {
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    let dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0) dayOfWeek = 7;
    return this.getWorkingDays().includes(dayOfWeek);
  }

  hasLunchBreak(): boolean {
    return !!this.lunchStart && !!this.lunchEnd;
  }

  scheduleStartMinutes(): number {
    return this._timeToMinutes(this.scheduleStart);
  }

  scheduleEndMinutes(): number {
    return this._timeToMinutes(this.scheduleEnd);
  }

  lunchStartMinutes(): number | null {
    return this.lunchStart ? this._timeToMinutes(this.lunchStart) : null;
  }

  lunchEndMinutes(): number | null {
    return this.lunchEnd ? this._timeToMinutes(this.lunchEnd) : null;
  }

  private _timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
