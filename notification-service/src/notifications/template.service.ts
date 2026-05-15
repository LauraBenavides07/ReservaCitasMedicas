import { Injectable } from '@nestjs/common';

@Injectable()
export class TemplateService {
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

  buildRescheduleMessage(data: {
    patientName: string;
    doctorName: string;
    appointmentDate: string;
    appointmentTime: string;
  }): string {
    const dateFormatted = this.formatDate(data.appointmentDate);
    const timeFormatted = data.appointmentTime.slice(0, 5);
    return (
      `🔄 *Cita Reprogramada - Piedrazul*\n\n` +
      `Hola ${data.patientName},\n` +
      `tu cita ha sido reprogramada para el *${dateFormatted}* a las *${timeFormatted}* ` +
      `con *${data.doctorName}*.\n\n` +
      `Por favor, confirma tu asistencia.`
    );
  }

  private formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
}