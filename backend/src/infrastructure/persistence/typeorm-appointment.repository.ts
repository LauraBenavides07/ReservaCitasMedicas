import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../../domain/entities/appointment.entity';
import { IAppointmentRepository } from '../../application/ports/appointment.repository';

@Injectable()
export class TypeOrmAppointmentRepository extends IAppointmentRepository {
  constructor(
    @InjectRepository(Appointment)
    private readonly repo: Repository<Appointment>,
  ) {
    super();
  }

  async findAndCount(options?: any): Promise<[Appointment[], number]> {
    return this.repo.findAndCount(options);
  }

  async find(options?: any): Promise<Appointment[]> {
    return this.repo.find(options);
  }

  async findOne(options: any): Promise<Appointment | null> {
    return this.repo.findOne(options);
  }

  async findOneBy(where: any): Promise<Appointment | null> {
    return this.repo.findOneBy(where);
  }

  create(data: Partial<Appointment>): Appointment {
    return this.repo.create(data);
  }

  async save(entity: Appointment): Promise<Appointment> {
    return this.repo.save(entity);
  }

  async count(options?: any): Promise<number> {
    return this.repo.count(options);
  }

  createQueryBuilder(): any {
    return this.repo.createQueryBuilder();
  }
}
