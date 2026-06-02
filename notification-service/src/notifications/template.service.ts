import { Injectable } from '@nestjs/common';

@Injectable()
export class TemplateService {
  
  // ─── WhatsApp Templates (Text Only) ──────────────────────────────

  buildCreatedMessage(data: {
    patientName: string;
    doctorName: string;
    appointmentDate: string;
    appointmentTime: string;
  }): string {
    const dateFormatted = this.formatDate(data.appointmentDate);
    const timeFormatted = data.appointmentTime.slice(0, 5);
    return (
      `💙 *¡Cita Confirmada! - Centro Médico Piedrazul*\n\n` +
      `Hola ${data.patientName}, le informamos que su cita con el/la *${data.doctorName}* ` +
      `ha sido reservada con éxito.\n\n` +
      `📅 *Fecha:* ${dateFormatted}\n` +
      `⏰ *Hora:* ${timeFormatted}\n\n` +
      `Si tiene algún inconveniente para asistir, por favor avísenos con tiempo a través de nuestra página web o llámenos.\n\n` +
      `¡Que tenga un excelente día!`
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
    const reasonText = data.reason ? `\n\n*Motivo:* ${data.reason}` : '';
    return (
      `⚠️ *Cita Cancelada - Piedrazul*\n\n` +
      `Estimado(a) ${data.patientName}, le informamos que la cita programada para el ` +
      `${dateFormatted} con el/la *${data.doctorName}* ha sido cancelada.${reasonText}\n\n` +
      `Si desea agendar una nueva cita, puede hacerlo nuevamente en nuestra plataforma.\n\n` +
      `Sentimos los inconvenientes.`
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
      `🔔 *Recordatorio de Cita - Piedrazul*\n\n` +
      `Hola ${data.patientName}, le recordamos que mañana tiene una cita médica con el/la ` +
      `*${data.doctorName}*.\n\n` +
      `📅 *Fecha:* ${dateFormatted}\n` +
      `⏰ *Hora:* ${timeFormatted}\n\n` +
      `Le recomendamos llegar 10 minutos antes. ¡Lo esperamos!`
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
      `Hola ${data.patientName}, le informamos que su cita ha sido cambiada para el ` +
      `*${dateFormatted}* a las *${timeFormatted}* con el/la *${data.doctorName}*.\n\n` +
      `Por favor, guarde estos nuevos datos. ¡Gracias!`
    );
  }

  // ─── Email Templates (HTML) ───────────────────────────────────

  buildEmailHtml(title: string, content: string): string {
    return `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #3E7BA6; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Piedrazul</h1>
          <p style="color: #CCE1F4; margin: 5px 0 0 0;">Cuidado con Calidez</p>
        </div>
        <div style="padding: 30px; font-size: 18px;">
          <h2 style="color: #3E7BA6; border-bottom: 2px solid #7FA5C9; padding-bottom: 10px;">${title}</h2>
          ${content}
          <div style="margin-top: 30px; padding: 20px; background-color: #F8F4F3; border-radius: 5px; font-size: 16px;">
            <strong>¿Necesita ayuda?</strong><br>
            Si tiene dudas o no reconoce esta acción, por favor comuníquese con nosotros.
          </div>
        </div>
        <div style="background-color: #eee; padding: 15px; text-align: center; font-size: 14px; color: #777;">
          © 2026 Piedrazul - Sistema de Gestión de Citas Médicas
        </div>
      </div>
    `;
  }

  buildCreatedEmail(data: { patientName: string; doctorName: string; appointmentDate: string; appointmentTime: string; }): string {
    const dateFormatted = this.formatDate(data.appointmentDate);
    const timeFormatted = data.appointmentTime.slice(0, 5);
    const content = `
      <p>Hola <strong>${data.patientName}</strong>,</p>
      <p>Nos alegra confirmarle que su cita médica ha sido agendada exitosamente.</p>
      <div style="background-color: #CCE1F4; padding: 15px; border-radius: 5px; border-left: 5px solid #3E7BA6;">
        <p style="margin: 5px 0;">👨‍⚕️ <strong>Médico:</strong> ${data.doctorName}</p>
        <p style="margin: 5px 0;">📅 <strong>Fecha:</strong> ${dateFormatted}</p>
        <p style="margin: 5px 0;">⏰ <strong>Hora:</strong> ${timeFormatted}</p>
      </div>
      <p style="margin-top: 20px;">Recuerde asistir 10 minutos antes de su cita.</p>
    `;
    return this.buildEmailHtml('Confirmación de Cita', content);
  }

  buildCancelledEmail(data: { patientName: string; doctorName: string; appointmentDate: string; appointmentTime: string; }): string {
    const dateFormatted = this.formatDate(data.appointmentDate);
    const content = `
      <p>Estimado(a) <strong>${data.patientName}</strong>,</p>
      <p>Le informamos que la cita que tenía programada para el día <strong>${dateFormatted}</strong> con el/la doctor(a) <strong>${data.doctorName}</strong> ha sido cancelada.</p>
      <p>Lamentamos los inconvenientes causados. Puede agendar una nueva cita cuando desee desde nuestra plataforma.</p>
    `;
    return this.buildEmailHtml('Cancelación de Cita', content);
  }

  buildReminderEmail(data: { patientName: string; doctorName: string; appointmentDate: string; appointmentTime: string; }): string {
    const dateFormatted = this.formatDate(data.appointmentDate);
    const timeFormatted = data.appointmentTime.slice(0, 5);
    const content = `
      <p>Hola <strong>${data.patientName}</strong>,</p>
      <p>Le escribimos para recordarle su cita médica programada para el día de <strong>mañana</strong>.</p>
      <div style="background-color: #CCE1F4; padding: 15px; border-radius: 5px; border-left: 5px solid #3E7BA6;">
        <p style="margin: 5px 0;">👨‍⚕️ <strong>Médico:</strong> ${data.doctorName}</p>
        <p style="margin: 5px 0;">📅 <strong>Fecha:</strong> ${dateFormatted}</p>
        <p style="margin: 5px 0;">⏰ <strong>Hora:</strong> ${timeFormatted}</p>
      </div>
      <p style="margin-top: 20px;">¡Lo esperamos!</p>
    `;
    return this.buildEmailHtml('Recordatorio de Cita', content);
  }

  buildRescheduledEmail(data: { patientName: string; doctorName: string; appointmentDate: string; appointmentTime: string; }): string {
    const dateFormatted = this.formatDate(data.appointmentDate);
    const timeFormatted = data.appointmentTime.slice(0, 5);
    const content = `
      <p>Hola <strong>${data.patientName}</strong>,</p>
      <p>Le informamos que su cita médica ha sido <strong>reprogramada</strong>.</p>
      <div style="background-color: #F8F4F3; padding: 15px; border-radius: 5px; border-left: 5px solid #7FA5C9;">
        <p style="margin: 5px 0;">👨‍⚕️ <strong>Médico:</strong> ${data.doctorName}</p>
        <p style="margin: 5px 0;">📅 <strong>Nueva Fecha:</strong> ${dateFormatted}</p>
        <p style="margin: 5px 0;">⏰ <strong>Nueva Hora:</strong> ${timeFormatted}</p>
      </div>
      <p style="margin-top: 20px;">Por favor, actualice su agenda con estos nuevos datos.</p>
    `;
    return this.buildEmailHtml('Reprogramación de Cita', content);
  }

  private formatDate(dateStr: string): string {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    const [year, month, day] = dateStr.split('-');
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${parseInt(day)} de ${months[parseInt(month) - 1]} de ${year}`;
  }
}