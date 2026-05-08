import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { WhatsAppService } from './whatsapp.service';
import { EmailService } from './email.service';
import { TemplateService } from './template.service';
import { NotificationLogService } from './notification-log.service';

interface NotificacionPayload {
  evento?: string;
  paciente?: string;
  patientName?: string;
  patientPhone?: string;
  doctorName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  correo?: string;
  telefono?: string;
  medico?: string;
  fecha?: string;
  hora?: string;
  motivo?: string;
}

@Controller()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(
    private readonly whatsAppService: WhatsAppService,
    private readonly emailService: EmailService,
    private readonly templateService: TemplateService,
    private readonly logService: NotificationLogService,
  ) {}

  @EventPattern('appointment.created')
  async handleAppointmentCreated(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    this.logger.log(`📨 Procesando appointment.created`);

    try {
      const patientName = data.patientName || 'Paciente';
      const patientPhone = data.patientPhone || '';
      const doctorName = data.doctorName || 'Médico';
      const appointmentDate = data.appointmentDate || 'fecha no especificada';
      const appointmentTime = data.appointmentTime?.slice(0, 5) || 'hora no especificada';
      const email = `${patientName.replace(' ', '.')}@example.com`;

      // Enviar correo
      const subject = '✅ Cita Confirmada - Piedrazul';
      const html = `<h1>Hola ${patientName}</h1><p>Tu cita con <strong>${doctorName}</strong> ha sido agendada para <strong>${appointmentDate}</strong> a las <strong>${appointmentTime}</strong>.</p>`;
      await this.emailService.sendEmail(email, subject, html);

      // Enviar WhatsApp
      if (patientPhone) {
        const mensaje = this.templateService.buildCreatedMessage({
          patientName: patientName,
          doctorName: doctorName,
          appointmentDate: appointmentDate,
          appointmentTime: appointmentTime,
        });
        await this.whatsAppService.sendTextMessage(patientPhone, mensaje);
      }

      // Guardar log
      await this.logService.guardarLog({
        evento: 'CITA_CREADA',
        destinatario: email,
        estado: 'ENVIADO',
        mensaje: `Cita creada para ${patientName} con ${doctorName}`,
      });

      channel.ack(originalMsg);
      this.logger.log(`✅ CITA_CREADA procesada exitosamente`);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`❌ Error: ${errorMessage}`);
      channel.nack(originalMsg, false, false);
    }
  }

  @EventPattern('appointment.cancelled')
  async handleAppointmentCancelled(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    this.logger.log(`📨 Procesando appointment.cancelled`);

    try {
      const patientName = data.patientName || 'Paciente';
      const patientPhone = data.patientPhone || '';
      const doctorName = data.doctorName || 'Médico';
      const appointmentDate = data.appointmentDate || 'fecha no especificada';
      const appointmentTime = data.appointmentTime?.slice(0, 5) || 'hora no especificada';
      const email = `${patientName.replace(' ', '.')}@example.com`;

      const subject = '❌ Cita Cancelada - Piedrazul';
      const html = `<h1>Hola ${patientName}</h1><p>Tu cita con <strong>${doctorName}</strong> del <strong>${appointmentDate}</strong> a las <strong>${appointmentTime}</strong> ha sido cancelada.</p>`;
      await this.emailService.sendEmail(email, subject, html);

      if (patientPhone) {
        const mensaje = this.templateService.buildCancelledMessage({
          patientName: patientName,
          doctorName: doctorName,
          appointmentDate: appointmentDate,
          appointmentTime: appointmentTime,
        });
        await this.whatsAppService.sendTextMessage(patientPhone, mensaje);
      }

      await this.logService.guardarLog({
        evento: 'CITA_CANCELADA',
        destinatario: email,
        estado: 'ENVIADO',
        mensaje: `Cita cancelada para ${patientName}`,
      });

      channel.ack(originalMsg);
      this.logger.log(`✅ CITA_CANCELADA procesada exitosamente`);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`❌ Error: ${errorMessage}`);
      channel.nack(originalMsg, false, false);
    }
  }

  @EventPattern('appointment.reminder')
  async handleAppointmentReminder(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    this.logger.log(`📨 Procesando appointment.reminder`);

    try {
      const patientName = data.patientName || 'Paciente';
      const patientPhone = data.patientPhone || '';
      const doctorName = data.doctorName || 'Médico';
      const appointmentDate = data.appointmentDate || 'fecha no especificada';
      const appointmentTime = data.appointmentTime?.slice(0, 5) || 'hora no especificada';
      const email = `${patientName.replace(' ', '.')}@example.com`;

      const subject = '⏰ Recordatorio de Cita - Piedrazul';
      const html = `<h1>Hola ${patientName}</h1><p>Te recordamos tu cita con <strong>${doctorName}</strong> mañana <strong>${appointmentDate}</strong> a las <strong>${appointmentTime}</strong>.</p>`;
      await this.emailService.sendEmail(email, subject, html);

      if (patientPhone) {
        const mensaje = this.templateService.buildReminderMessage({
          patientName: patientName,
          doctorName: doctorName,
          appointmentDate: appointmentDate,
          appointmentTime: appointmentTime,
        });
        await this.whatsAppService.sendTextMessage(patientPhone, mensaje);
      }

      await this.logService.guardarLog({
        evento: 'RECORDATORIO_CITA',
        destinatario: email,
        estado: 'ENVIADO',
        mensaje: `Recordatorio enviado para ${patientName}`,
      });

      channel.ack(originalMsg);
      this.logger.log(`✅ RECORDATORIO_CITA procesado exitosamente`);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`❌ Error: ${errorMessage}`);
      channel.nack(originalMsg, false, false);
    }
  }

  // Manejador para el formato de la guía (opcional)
  @EventPattern('notificacion')
  async procesarNotificacion(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    this.logger.log(`📨 Procesando notificacion con evento: ${data.evento}`);

    try {
      const patientName = data.paciente || 'Paciente';
      const patientPhone = data.telefono || '';
      const doctorName = data.medico || 'Médico';
      const appointmentDate = data.fecha || 'fecha no especificada';
      const appointmentTime = data.hora || 'hora no especificada';
      const email = data.correo || `${patientName.replace(' ', '.')}@example.com`;

      let subject = '';
      let html = '';

      switch (data.evento) {
        case 'CITA_CREADA':
          subject = '✅ Cita Confirmada - Piedrazul';
          html = `<h1>Hola ${patientName}</h1><p>Tu cita con <strong>${doctorName}</strong> ha sido agendada para <strong>${appointmentDate}</strong> a las <strong>${appointmentTime}</strong>.</p>`;
          break;
        case 'CITA_CANCELADA':
          subject = '❌ Cita Cancelada - Piedrazul';
          html = `<h1>Hola ${patientName}</h1><p>Tu cita ha sido cancelada.</p>`;
          break;
        default:
          return;
      }

      await this.emailService.sendEmail(email, subject, html);

      if (patientPhone) {
        let mensaje = '';
        if (data.evento === 'CITA_CREADA') {
          mensaje = this.templateService.buildCreatedMessage({
            patientName: patientName,
            doctorName: doctorName,
            appointmentDate: appointmentDate,
            appointmentTime: appointmentTime,
          });
        } else if (data.evento === 'CITA_CANCELADA') {
          mensaje = this.templateService.buildCancelledMessage({
            patientName: patientName,
            doctorName: doctorName,
            appointmentDate: appointmentDate,
            appointmentTime: appointmentTime,
          });
        }
        if (mensaje) {
          await this.whatsAppService.sendTextMessage(patientPhone, mensaje);
        }
      }

      await this.logService.guardarLog({
        evento: data.evento || 'DESCONOCIDO',
        destinatario: email,
        estado: 'ENVIADO',
        mensaje: `Notificación ${data.evento} procesada`,
      });

      channel.ack(originalMsg);
      this.logger.log(`✅ ${data.evento} procesado exitosamente`);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`❌ Error: ${errorMessage}`);
      channel.nack(originalMsg, false, false);
    }
  }
}