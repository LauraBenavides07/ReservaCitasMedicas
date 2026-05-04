/**
 * Contrato de evento: appointment.reminder
 * Emitido por el CRON job del backend principal para citas del día siguiente.
 */
export interface AppointmentReminderEvent {
  appointmentId: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  appointmentDate: string; // formato YYYY-MM-DD
  appointmentTime: string; // formato HH:mm
}
