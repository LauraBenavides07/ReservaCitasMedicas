import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  Index,
  Check,
} from 'typeorm';

@Entity('configs')
@Check(`LENGTH("key") <= 100`)
@Check(`jsonb_typeof("value") = 'object'`)
export class Config {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string;

  @Index({ type: 'gin' })
  @Column({ type: 'jsonb' })
  value: any;

  @Column({ type: 'text', nullable: true })
  description: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
