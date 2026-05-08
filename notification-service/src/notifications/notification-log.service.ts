import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationLog } from './notification-log.entity';

@Injectable()
export class NotificationLogService {
  constructor(
    @InjectRepository(NotificationLog)
    private logRepo: Repository<NotificationLog>,
  ) {}

  async guardarLog(data: {
    evento: string;
    destinatario: string;
    estado: string;
    mensaje: string;
  }): Promise<NotificationLog> {
    const log = this.logRepo.create({
      evento: data.evento,
      destinatario: data.destinatario,
      estado: data.estado,
      mensaje: data.mensaje,
    });
    return this.logRepo.save(log);
  }

  async obtenerLogs(): Promise<NotificationLog[]> {
    return this.logRepo.find({
      order: { fecha_envio: 'DESC' },
    });
  }
}