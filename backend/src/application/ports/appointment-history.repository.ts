import { AppointmentHistory } from '../../domain/entities/appointment-history.entity';

export abstract class IAppointmentHistoryRepository {
  abstract create(data: Partial<AppointmentHistory>): AppointmentHistory;
  abstract save(entity: AppointmentHistory): Promise<AppointmentHistory>;
  abstract find(options?: any): Promise<AppointmentHistory[]>;
  abstract findAndCount(options?: any): Promise<[AppointmentHistory[], number]>;
}
