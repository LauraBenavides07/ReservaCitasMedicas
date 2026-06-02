import { FindManyOptions, FindOptionsWhere } from 'typeorm';
import { DoctorException } from '../../domain/entities/doctor-exception.entity';

export abstract class IDoctorExceptionRepository {
  abstract findOneBy(
    where: FindOptionsWhere<DoctorException>,
  ): Promise<DoctorException | null>;
  abstract find(
    options?: FindManyOptions<DoctorException>,
  ): Promise<DoctorException[]>;
  abstract create(data: Partial<DoctorException>): DoctorException;
  abstract save(entity: DoctorException): Promise<DoctorException>;
  abstract delete(criteria: string | number): Promise<unknown>;
}
