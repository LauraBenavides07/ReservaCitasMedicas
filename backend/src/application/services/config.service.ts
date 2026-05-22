import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Config } from '../../domain/entities/config.entity';
import { GlobalConfig } from '../../domain/types/global-config.type';

const DEFAULT_CONFIG: GlobalConfig = {
  minAdvanceHours: 2,
  appointmentWindowDays: 15,
};

@Injectable()
export class ConfigService implements OnModuleInit {
  constructor(
    @InjectRepository(Config)
    private configRepository: Repository<Config>,
  ) {}

  async onModuleInit(): Promise<void> {
    const existing = await this.configRepository.findOne({
      where: { key: 'appointment_rules' },
    });
    if (!existing) {
      await this.configRepository.save({
        key: 'appointment_rules',
        value: { ...DEFAULT_CONFIG },
      });
    }
  }

  async getConfig(): Promise<GlobalConfig> {
    const config = await this.configRepository.findOne({
      where: { key: 'appointment_rules' },
    });
    return config?.value
      ? { ...DEFAULT_CONFIG, ...config.value }
      : { ...DEFAULT_CONFIG };
  }

  async updateConfig(data: Partial<GlobalConfig>): Promise<GlobalConfig> {
    const existing = await this.configRepository.findOne({
      where: { key: 'appointment_rules' },
    });
    if (existing) {
      const merged = { ...existing.value, ...data };
      await this.configRepository.update(
        { key: 'appointment_rules' },
        { value: merged },
      );
    }
    return this.getConfig();
  }
}
