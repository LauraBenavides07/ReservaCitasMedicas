import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Appointment } from './appointment.entity';

@Entity('appointment_history')
export class AppointmentHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Appointment)
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @Column({ type: 'varchar', name: 'change_type', length: 30 })
  changeType: string;

  @Column({ type: 'date', name: 'previous_date', nullable: true })
  previousDate: string | null;

  @Column({ type: 'varchar', name: 'previous_time', nullable: true })
  previousTime: string | null;

  @Column({ type: 'varchar', name: 'previous_status', length: 20, nullable: true })
  previousStatus: string | null;

  @Column({ type: 'date', name: 'new_date', nullable: true })
  newDate: string | null;

  @Column({ type: 'varchar', name: 'new_time', nullable: true })
  newTime: string | null;

  @Column({ type: 'varchar', name: 'new_status', length: 20, nullable: true })
  newStatus: string | null;

  @Column({ type: 'varchar', name: 'changed_by', length: 100 })
  changedBy: string;

  @Column({ type: 'varchar', name: 'changed_by_role', length: 30 })
  changedByRole: string;

  @Column({ type: 'text', name: 'reason', nullable: true })
  reason: string;

  @CreateDateColumn({ name: 'changed_at' })
  changedAt: Date;
}
