import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Appointment } from './appointment.entity';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  specialty: string;

  @Column({ default: '08:00' })
  startTime: string; // HH:mm

  @Column({ default: '18:00' })
  endTime: string; // HH:mm

  @Column({ default: 30 })
  appointmentDuration: number; // minutes

  @OneToMany(() => Appointment, (appointment) => appointment.doctor)
  appointments: Appointment[];
}
