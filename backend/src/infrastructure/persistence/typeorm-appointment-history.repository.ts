import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async find(options?: any): Promise<AppointmentHistory[]> {
    return this.repo.find(options);
  }

  async findAndCount(options?: any): Promise<[AppointmentHistory[], number]> {
    return this.repo.findAndCount(options);
  }
}
