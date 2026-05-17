import { Doctor } from '../../domain/entities/doctor.entity';

export abstract class IDoctorRepository {
  abstract find(options?: any): Promise<Doctor[]>;
  abstract findOneBy(where: any): Promise<Doctor | null>;
  abstract create(data: Partial<Doctor>): Doctor;
  abstract save(entity: Doctor): Promise<Doctor>;
  abstract update(id: any, data: Partial<Doctor>): Promise<any>;
  abstract remove(entity: Doctor): Promise<Doctor>;
}
