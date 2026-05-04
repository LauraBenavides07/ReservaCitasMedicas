/**
 * Contrato de evento: appointment.cancelled
 * Emitido por el backend principal cuando se cancela una cita.
 */
export interface AppointmentCancelledEvent {
  appointmentId: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  appointmentDate: string; // formato YYYY-MM-DD
  appointmentTime: string; // formato HH:mm
  reason?: string;
}
