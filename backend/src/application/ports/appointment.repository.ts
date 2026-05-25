import { Appointment } from '../../domain/entities/appointment.entity';
import type { SelectQueryBuilder } from 'typeorm';

export abstract class IAppointmentRepository {
  abstract findAndCount(options?: any): Promise<[Appointment[], number]>;
  abstract find(options?: any): Promise<Appointment[]>;
  abstract findOne(options: any): Promise<Appointment | null>;
  abstract findOneBy(where: any): Promise<Appointment | null>;
  abstract create(data: Partial<Appointment>): Appointment;
  abstract save(entity: Appointment): Promise<Appointment>;
  abstract count(options?: any): Promise<number>;
  abstract createQueryBuilder(alias?: string): SelectQueryBuilder<Appointment>;
}
