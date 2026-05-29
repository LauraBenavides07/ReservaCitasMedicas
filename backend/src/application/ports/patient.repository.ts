import { FindOneOptions, FindOptionsWhere } from 'typeorm';
import { Patient } from '../../domain/entities/patient.entity';

export abstract class IPatientRepository {
  abstract findAll(): Promise<Patient[]>;
  abstract findOneBy(
    where: FindOptionsWhere<Patient> | FindOptionsWhere<Patient>[],
  ): Promise<Patient | null>;
  abstract findOne(options: FindOneOptions<Patient>): Promise<Patient | null>;
  abstract create(data: Partial<Patient>): Patient;
  abstract save(entity: Patient): Promise<Patient>;
  abstract existeDocumento(document: string): Promise<boolean>;
}
