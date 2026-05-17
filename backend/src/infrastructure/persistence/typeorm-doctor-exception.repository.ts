import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorException } from '../../domain/entities/doctor-exception.entity';
import { IDoctorExceptionRepository } from '../../application/ports/doctor-exception.repository';

@Injectable()
export class TypeOrmDoctorExceptionRepository extends IDoctorExceptionRepository {
  constructor(
    @InjectRepository(DoctorException)
    private readonly repo: Repository<DoctorException>,
  ) { super(); }

  async findOneBy(where: any): Promise<DoctorException | null> {
    return this.repo.findOneBy(where);
  }

  async find(options?: any): Promise<DoctorException[]> {
    return this.repo.find(options);
  }

  create(data: Partial<DoctorException>): DoctorException {
    return this.repo.create(data);
  }

  async save(entity: DoctorException): Promise<DoctorException> {
    return this.repo.save(entity);
  }

  async delete(criteria: any): Promise<any> {
    return this.repo.delete(criteria);
  }
}
