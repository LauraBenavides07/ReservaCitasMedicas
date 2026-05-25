import { FindManyOptions, FindOneOptions, FindOptionsWhere } from 'typeorm';
import { Appointment } from '../../domain/entities/appointment.entity';
import type { SelectQueryBuilder } from 'typeorm';

export abstract class IAppointmentRepository {
  abstract findAndCount(
    options?: FindManyOptions<Appointment>,
  ): Promise<[Appointment[], number]>;
  abstract find(options?: FindManyOptions<Appointment>): Promise<Appointment[]>;
  abstract findOne(
    options: FindOneOptions<Appointment>,
  ): Promise<Appointment | null>;
  abstract findOneBy(
    where: FindOptionsWhere<Appointment>,
  ): Promise<Appointment | null>;
  abstract create(data: Partial<Appointment>): Appointment;
  abstract save(entity: Appointment): Promise<Appointment>;
  abstract count(options?: FindManyOptions<Appointment>): Promise<number>;
  abstract createQueryBuilder(alias?: string): SelectQueryBuilder<Appointment>;
}
