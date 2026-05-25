import { FindManyOptions } from 'typeorm';
import { AppointmentHistory } from '../../domain/entities/appointment-history.entity';

export abstract class IAppointmentHistoryRepository {
  abstract create(data: Partial<AppointmentHistory>): AppointmentHistory;
  abstract save(entity: AppointmentHistory): Promise<AppointmentHistory>;
  abstract find(
    options?: FindManyOptions<AppointmentHistory>,
  ): Promise<AppointmentHistory[]>;
  abstract findAndCount(
    options?: FindManyOptions<AppointmentHistory>,
  ): Promise<[AppointmentHistory[], number]>;
}
