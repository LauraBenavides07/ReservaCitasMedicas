import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('notificaciones')
export class NotificationLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  evento: string;

  @Column({ length: 200 })
  destinatario: string;

  @CreateDateColumn({ name: 'fecha_envio' })
  fecha_envio: Date;

  @Column({ length: 50 })
  estado: string;

  @Column({ type: 'text' })
  mensaje: string;
}