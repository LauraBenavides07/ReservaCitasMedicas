import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { Doctor } from './doctor.entity';
import { Patient } from './patient.entity';
import { AppointmentStatus } from '../types/appointment-status.enum';

@Entity('appointments')
@Index(['doctor', 'appointmentDate', 'appointmentTime'], { unique: true })
@Index(['doctor'])
@Index(['patient'])
@Index(['appointmentDate'])
@Check(`"status" IN ('agendada', 'confirmada', 'completada', 'cancelada')`)
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'appointment_date', type: 'date' })
  appointmentDate: string;

  @Column({ name: 'appointment_time', type: 'time' })
  appointmentTime: string;

  @Column({ default: AppointmentStatus.SCHEDULED })
  status: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @ManyToOne(() => Doctor, (doctor) => doctor.appointments)
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @ManyToOne(() => Patient, (patient) => patient.appointments)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ type: 'text', nullable: true })
  observations?: string;

  @Column({ type: 'text', nullable: true })
  diagnosis?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  isScheduled(): boolean {
    return this.status === AppointmentStatus.SCHEDULED;
  }

  isCancelled(): boolean {
    return this.status === AppointmentStatus.CANCELLED;
  }

  isCompleted(): boolean {
    return this.status === AppointmentStatus.COMPLETED;
  }

  canBeCancelled(): boolean {
    return !this.isCancelled() && !this.isCompleted() && this.isInFuture();
  }

  canBeConfirmed(): boolean {
    return !this.isCancelled();
  }

  canBeRescheduled(): boolean {
    return this.isScheduled() || this.status === AppointmentStatus.CONFIRMED;
  }

  isInFuture(): boolean {
    const now = new Date();
    const appDate = new Date(`${this.appointmentDate}T${this.appointmentTime}`);
    return appDate > now;
  }

  isPast(): boolean {
    const now = new Date();
    const appDate = new Date(`${this.appointmentDate}T${this.appointmentTime}`);
    return appDate < now;
  }

  isOwnedBy(patientId: string): boolean {
    return (
      this.patient?.id === patientId || this.patient?.keycloakId === patientId
    );
  }

  belongsToDoctor(doctorId: string): boolean {
    return this.doctor?.id === doctorId;
  }

  cancel(): void {
    this.status = AppointmentStatus.CANCELLED;
  }

  confirm(): void {
    this.status = AppointmentStatus.CONFIRMED;
  }

  complete(): void {
    this.status = AppointmentStatus.COMPLETED;
  }

  reschedule(date: string, time: string): void {
    this.appointmentDate = date;
    this.appointmentTime = time;
    this.status = AppointmentStatus.SCHEDULED;
  }
}
