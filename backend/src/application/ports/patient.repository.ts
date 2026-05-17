import { Patient } from '../../domain/entities/patient.entity';

export abstract class IPatientRepository {
  abstract findOneBy(where: any): Promise<Patient | null>;
  abstract findOne(options: any): Promise<Patient | null>;
  abstract create(data: Partial<Patient>): Patient;
  abstract save(entity: Patient): Promise<Patient>;
}
