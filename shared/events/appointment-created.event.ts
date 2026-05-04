/**
 * Contrato de evento: appointment.created
 * Emitido por el backend principal cuando se crea una cita exitosamente.
 */
export interface AppointmentCreatedEvent {
  appointmentId: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  appointmentDate: string; // formato YYYY-MM-DD
  appointmentTime: string; // formato HH:mm
}
