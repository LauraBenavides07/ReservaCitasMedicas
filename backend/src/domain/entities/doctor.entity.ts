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

  @Column({ default: '1,2,3,4,5' })
  workingDays: string; // 1=Mon, 2=Tue, ..., 7=Sun

  @Column({ nullable: true })
  breakStart: string; // HH:mm

  @Column({ nullable: true })
  breakEnd: string; // HH:mm

  @OneToMany(() => Appointment, (appointment) => appointment.doctor)
  appointments: Appointment[];
}
