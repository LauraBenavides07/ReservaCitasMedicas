import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Config } from '../../domain/entities/config.entity';

@Injectable()
export class ConfigService implements OnModuleInit {
  constructor(
    @InjectRepository(Config)
    private configRepository: Repository<Config>,
  ) {}

  async onModuleInit() {
    const existing = await this.configRepository.findOne({ where: { key: 'appointment_rules' } });
    if (!existing) {
      await this.configRepository.save({
        key: 'appointment_rules',
        value: {
          minAdvanceHours: 2,
          appointmentWindowWeeks: 4,
        },
      });
    }
  }

  async getConfig() {
    const config = await this.configRepository.findOne({ where: { key: 'appointment_rules' } });
    return config?.value;
  }

  async updateConfig(data: any) {
    const existing = await this.configRepository.findOne({ where: { key: 'appointment_rules' } });
    if (existing) {
      await this.configRepository.update({ key: 'appointment_rules' }, { value: data });
    }
    return this.getConfig();
  }
}
