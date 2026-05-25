import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions, FindOptionsWhere } from 'typeorm';
import { Patient } from '../../domain/entities/patient.entity';
import { IPatientRepository } from '../../application/ports/patient.repository';

@Injectable()
export class TypeOrmPatientRepository extends IPatientRepository {
  constructor(
    @InjectRepository(Patient)
    private readonly repo: Repository<Patient>,
  ) {
    super();
  }

  async findOneBy(where: FindOptionsWhere<Patient>): Promise<Patient | null> {
    return this.repo.findOneBy(where);
  }

  async findOne(options: FindOneOptions<Patient>): Promise<Patient | null> {
    return this.repo.findOne(options);
  }

  create(data: Partial<Patient>): Patient {
    return this.repo.create(data);
  }

  async save(entity: Patient): Promise<Patient> {
    return this.repo.save(entity);
  }
}
