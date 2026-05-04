import { Injectable } from '@nestjs/common';

/**
 * Construye los textos de los mensajes de WhatsApp según el tipo de evento.
 * Centraliza toda la lógica de redacción para facilitar cambios futuros
 * (ej. migrar a plantillas aprobadas por Meta).
 */
@Injectable()
export class TemplateService {
  /**
   * Mensaje de confirmación de nueva cita.
   * Ejemplo: "Hola María García, tu cita con Dr(a). Juan López ha sido
   * confirmada para el 15/05/2026 a las 10:00. 📅"
   */
  buildCreatedMessage(data: {
    patientName: string;
    doctorName: string;
    appointmentDate: string;
    appointmentTime: string;
  }): string {
    const dateFormatted = this.formatDate(data.appointmentDate);
    const timeFormatted = data.appointmentTime.slice(0, 5);
    return (
      `✅ *Cita Confirmada - Piedrazul*\n\n` +
      `Hola ${data.patientName},\n` +
      `tu cita con *${data.doctorName}* ha sido agendada para el ` +
      `*${dateFormatted}* a las *${timeFormatted}*.\n\n` +
      `Si necesitas cancelarla, hazlo con al menos 2 horas de anticipación desde nuestra plataforma.`
    );
  }

  /**
   * Mensaje de cancelación de cita.
   */
  buildCancelledMessage(data: {
    patientName: string;
    doctorName: string;
    appointmentDate: string;
    appointmentTime: string;
    reason?: string;
  }): string {
    const dateFormatted = this.formatDate(data.appointmentDate);
    const timeFormatted = data.appointmentTime.slice(0, 5);
    const reasonText = data.reason ? `\n\nMotivo: ${data.reason}` : '';
    return (
      `❌ *Cita Cancelada - Piedrazul*\n\n` +
      `Hola ${data.patientName},\n` +
      `tu cita con *${data.doctorName}* del *${dateFormatted}* a las *${timeFormatted}* ` +
      `ha sido cancelada.${reasonText}\n\n` +
      `Puedes agendar una nueva cita en nuestra plataforma.`
    );
  }

  /**
   * Mensaje de recordatorio para el día siguiente.
   */
  buildReminderMessage(data: {
    patientName: string;
    doctorName: string;
    appointmentDate: string;
    appointmentTime: string;
  }): string {
    const dateFormatted = this.formatDate(data.appointmentDate);
    const timeFormatted = data.appointmentTime.slice(0, 5);
    return (
      `⏰ *Recordatorio de Cita - Piedrazul*\n\n` +
      `Hola ${data.patientName},\n` +
      `te recordamos que mañana *${dateFormatted}* a las *${timeFormatted}* ` +
      `tienes una cita con *${data.doctorName}*.\n\n` +
      `Por favor, llega 10 minutos antes. ¡Hasta pronto!`
    );
  }

  /**
   * Convierte YYYY-MM-DD a DD/MM/YYYY para mayor legibilidad.
   */
  private formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
}
