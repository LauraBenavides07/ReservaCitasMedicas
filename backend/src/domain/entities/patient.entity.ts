import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Check,
} from 'typeorm';
import { Appointment } from './appointment.entity';

@Entity('patients')
@Check(`LENGTH("document") <= 20`)
@Check(`LENGTH("first_name") <= 100`)
@Check(`LENGTH("last_name") <= 100`)
@Check(`LENGTH("phone") <= 20`)
@Check(`"gender" IN ('M', 'F', 'O')`)
@Check(`"email" IS NULL OR "email" ~* '^[^@]+@[^@]+$'`)
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  document: string;

  @Column({ name: 'keycloak_id', type: 'uuid', nullable: true, unique: true })
  keycloakId: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column()
  phone: string;

  @Column()
  gender: string;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate: string;

  @Column({ type: 'text', nullable: true })
  diagnosis?: string;

  @Column({ type: 'text', nullable: true })
  observations?: string;

  @Column({ nullable: true })
  email: string;

  @Column({ select: false, nullable: true })
  password?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Appointment, (appointment) => appointment.patient)
  appointments: Appointment[];
}
