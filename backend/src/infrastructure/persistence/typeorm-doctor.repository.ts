import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, FindOptionsWhere } from 'typeorm';
import { Doctor } from '../../domain/entities/doctor.entity';
import { IDoctorRepository } from '../../application/ports/doctor.repository';
import { Patient } from '../../domain/entities/patient.entity';

@Injectable()

export class TypeOrmDoctorRepository extends IDoctorRepository {
  constructor(
    @InjectRepository(Doctor)
    private readonly repo: Repository<Doctor>,
    @InjectRepository(Patient)  
    private readonly patientRepo: Repository<Patient>,
  
  ) {
    super();
  }

  async existsByDocument(document: string): Promise<boolean> {
    const count = await this.repo.count({ where: { document } });
    return count > 0;
  }

  async existsInPatients(document: string): Promise<boolean> {
        const count = await this.patientRepo.count({ where: { document } });
        return count > 0;
  }

  async find(options?: FindManyOptions<Doctor>): Promise<Doctor[]> {
    return this.repo.find(options);
  }

  async findOneBy(where: FindOptionsWhere<Doctor>): Promise<Doctor | null> {
    return this.repo.findOneBy(where);
  }

  create(data: Partial<Doctor>): Doctor {
    return this.repo.create(data);
  }

  async save(entity: Doctor): Promise<Doctor> {
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Doctor>): Promise<unknown> {
    return this.repo.update(id, data);
  }

  async remove(entity: Doctor): Promise<Doctor> {
    return this.repo.remove(entity);
  }
}
