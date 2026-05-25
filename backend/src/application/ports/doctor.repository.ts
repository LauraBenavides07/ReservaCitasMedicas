import { FindManyOptions, FindOptionsWhere } from 'typeorm';
import { Doctor } from '../../domain/entities/doctor.entity';

export abstract class IDoctorRepository {
  abstract find(options?: FindManyOptions<Doctor>): Promise<Doctor[]>;
  abstract findOneBy(where: FindOptionsWhere<Doctor>): Promise<Doctor | null>;
  abstract create(data: Partial<Doctor>): Doctor;
  abstract save(entity: Doctor): Promise<Doctor>;
  abstract update(id: string, data: Partial<Doctor>): Promise<unknown>;
  abstract remove(entity: Doctor): Promise<Doctor>;
}
