import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Doctor } from './doctor.entity';
import { Patient } from './patient.entity';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD

  @Column()
  time: string; // HH:mm

  @Column({ default: 'agendada' })
  status: string;

  @ManyToOne(() => Doctor, (doctor) => doctor.appointments)
  doctor: Doctor;

  @ManyToOne(() => Patient, (patient) => patient.appointments)
  patient: Patient;
}
