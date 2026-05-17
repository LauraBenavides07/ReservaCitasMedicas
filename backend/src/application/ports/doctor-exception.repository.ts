import { DoctorException } from '../../domain/entities/doctor-exception.entity';

export abstract class IDoctorExceptionRepository {
  abstract findOneBy(where: any): Promise<DoctorException | null>;
  abstract find(options?: any): Promise<DoctorException[]>;
  abstract create(data: Partial<DoctorException>): DoctorException;
  abstract save(entity: DoctorException): Promise<DoctorException>;
  abstract delete(criteria: any): Promise<any>;
}
