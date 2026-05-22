export class AppointmentHistoryEntryDto {
  id: string;
  appointmentId: string;
  changeType: string;
  previousDate: string | null;
  previousTime: string | null;
  previousStatus: string | null;
  newDate: string | null;
  newTime: string | null;
  newStatus: string | null;
  changedBy: string;
  changedByRole: string;
  reason: string | null;
  changedAt: Date;
}
