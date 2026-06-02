import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, FindOptionsWhere } from 'typeorm';
import { DoctorException } from '../../domain/entities/doctor-exception.entity';
import { IDoctorExceptionRepository } from '../../application/ports/doctor-exception.repository';

@Injectable()
export class TypeOrmDoctorExceptionRepository extends IDoctorExceptionRepository {
  constructor(
    @InjectRepository(DoctorException)
    private readonly repo: Repository<DoctorException>,
  ) {
    super();
  }

  async findOneBy(
    where: FindOptionsWhere<DoctorException>,
  ): Promise<DoctorException | null> {
    return this.repo.findOneBy(where);
  }

  async find(
    options?: FindManyOptions<DoctorException>,
  ): Promise<DoctorException[]> {
    return this.repo.find(options);
  }

  create(data: Partial<DoctorException>): DoctorException {
    return this.repo.create(data);
  }

  async save(entity: DoctorException): Promise<DoctorException> {
    return this.repo.save(entity);
  }

  async delete(criteria: string | number): Promise<unknown> {
    return this.repo.delete(criteria);
  }
}
