import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { WhatsAppService } from './whatsapp.service';
import { TemplateService } from './template.service';

@Controller()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(
    private readonly whatsAppService: WhatsAppService,
    private readonly templateService: TemplateService,
  ) {}

  /**
   * Consume el evento appointment.created
   * Envía confirmación de cita al paciente por WhatsApp.
   */
  @EventPattern('appointment.created')
  async handleAppointmentCreated(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      this.logger.log(
        `[appointment.created] Sending confirmation to ${data.patientPhone}`,
      );
      const message = this.templateService.buildCreatedMessage(data);
      await this.whatsAppService.sendTextMessage(data.patientPhone, message);
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(
        `[appointment.created] Failed for ${data.patientPhone}: ${error.message}`,
      );
      // nack sin requeue para evitar bucles infinitos (irá al Dead Letter Exchange)
      channel.nack(originalMsg, false, false);
    }
  }

  /**
   * Consume el evento appointment.cancelled
   * Envía notificación de cancelación al paciente por WhatsApp.
   */
  @EventPattern('appointment.cancelled')
  async handleAppointmentCancelled(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      this.logger.log(
        `[appointment.cancelled] Sending cancellation to ${data.patientPhone}`,
      );
      const message = this.templateService.buildCancelledMessage(data);
      await this.whatsAppService.sendTextMessage(data.patientPhone, message);
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(
        `[appointment.cancelled] Failed for ${data.patientPhone}: ${error.message}`,
      );
      channel.nack(originalMsg, false, false);
    }
  }

  /**
   * Consume el evento appointment.reminder
   * Envía recordatorio de cita del día siguiente al paciente.
   */
  @EventPattern('appointment.reminder')
  async handleAppointmentReminder(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      this.logger.log(
        `[appointment.reminder] Sending reminder to ${data.patientPhone}`,
      );
      const message = this.templateService.buildReminderMessage(data);
      await this.whatsAppService.sendTextMessage(data.patientPhone, message);
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(
        `[appointment.reminder] Failed for ${data.patientPhone}: ${error.message}`,
      );
      channel.nack(originalMsg, false, false);
    }
  }
}
