import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Check,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff', // Agendador
  DOCTOR = 'doctor',
}

@Entity('users')
@Check(`LENGTH("email") <= 100`)
@Check(`LENGTH("first_name") <= 100`)
@Check(`LENGTH("last_name") <= 100`)
@Check(`"role" IN ('admin', 'staff', 'doctor')`)
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'keycloak_id', type: 'uuid', nullable: true, unique: true })
  keycloakId: string;

  @Column()
  password: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ default: UserRole.STAFF })
  role: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
