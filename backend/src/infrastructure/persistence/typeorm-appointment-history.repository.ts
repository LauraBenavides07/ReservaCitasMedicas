import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, SelectQueryBuilder } from 'typeorm';
import { AppointmentHistory } from '../../domain/entities/appointment-history.entity';
import { IAppointmentHistoryRepository } from '../../application/ports/appointment-history.repository';

@Injectable()
export class TypeOrmAppointmentHistoryRepository extends IAppointmentHistoryRepository {
  constructor(
    @InjectRepository(AppointmentHistory)
    private readonly repo: Repository<AppointmentHistory>,
  ) {
    super();
  }

  create(data: Partial<AppointmentHistory>): AppointmentHistory {
    return this.repo.create(data);
  }

  async save(entity: AppointmentHistory): Promise<AppointmentHistory> {
    return this.repo.save(entity);
  }

  async find(
    options?: FindManyOptions<AppointmentHistory>,
  ): Promise<AppointmentHistory[]> {
    return this.repo.find(options);
  }

  async findAndCount(
    options?: FindManyOptions<AppointmentHistory>,
  ): Promise<[AppointmentHistory[], number]> {
    return this.repo.findAndCount(options);
  }

  createQueryBuilder(alias?: string): SelectQueryBuilder<AppointmentHistory> {
    return this.repo.createQueryBuilder(alias);
  }
}
