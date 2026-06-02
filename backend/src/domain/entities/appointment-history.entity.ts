import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { Appointment } from './appointment.entity';

@Entity('appointment_history')
@Index(['appointment'])
@Check(`LENGTH("change_type") <= 30`)
@Check(`LENGTH("previous_status") <= 20`)
@Check(`LENGTH("new_status") <= 20`)
@Check(`LENGTH("changed_by") <= 100`)
@Check(`LENGTH("changed_by_role") <= 30`)
export class AppointmentHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Appointment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @Column('varchar', { name: 'change_type' })
  changeType: string;

  @Column({ type: 'date', name: 'previous_date', nullable: true })
  previousDate: string | null;

  @Column('varchar', { name: 'previous_time', nullable: true })
  previousTime: string | null;

  @Column('varchar', { name: 'previous_status', nullable: true })
  previousStatus: string | null;

  @Column({ type: 'date', name: 'new_date', nullable: true })
  newDate: string | null;

  @Column('varchar', { name: 'new_time', nullable: true })
  newTime: string | null;

  @Column('varchar', { name: 'new_status', nullable: true })
  newStatus: string | null;

  @Column('varchar', { name: 'changed_by' })
  changedBy: string;

  @Column('varchar', { name: 'changed_by_role' })
  changedByRole: string;

  @Column({ type: 'text', name: 'reason', nullable: true })
  reason: string;

  @CreateDateColumn({ name: 'changed_at', type: 'timestamptz' })
  changedAt: Date;
  
}
