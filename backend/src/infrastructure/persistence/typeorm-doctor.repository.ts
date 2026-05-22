import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from '../../domain/entities/doctor.entity';
import { IDoctorRepository } from '../../application/ports/doctor.repository';

@Injectable()
export class TypeOrmDoctorRepository extends IDoctorRepository {
  constructor(
    @InjectRepository(Doctor)
    private readonly repo: Repository<Doctor>,
  ) {
    super();
  }

  async find(options?: any): Promise<Doctor[]> {
    return this.repo.find(options);
  }

  async findOneBy(where: any): Promise<Doctor | null> {
    return this.repo.findOneBy(where);
  }

  create(data: Partial<Doctor>): Doctor {
    return this.repo.create(data);
  }

  async save(entity: Doctor): Promise<Doctor> {
    return this.repo.save(entity);
  }

  async update(id: any, data: Partial<Doctor>): Promise<any> {
    return this.repo.update(id, data);
  }

  async remove(entity: Doctor): Promise<Doctor> {
    return this.repo.remove(entity);
  }
}
