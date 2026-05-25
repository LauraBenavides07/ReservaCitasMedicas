import { FindOneOptions, FindOptionsWhere } from 'typeorm';
import { Patient } from '../../domain/entities/patient.entity';

export abstract class IPatientRepository {
  abstract findOneBy(where: FindOptionsWhere<Patient>): Promise<Patient | null>;
  abstract findOne(options: FindOneOptions<Patient>): Promise<Patient | null>;
  abstract create(data: Partial<Patient>): Patient;
  abstract save(entity: Patient): Promise<Patient>;
}
