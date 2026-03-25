import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('configs')
export class Config {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 2 })
  minAdvanceHours: number;

  @Column({ default: 4 })
  appointmentWindowWeeks: number;
}
