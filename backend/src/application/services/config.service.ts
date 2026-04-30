import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Config } from '../../domain/entities/config.entity';

export class GlobalConfig {
  minAdvanceHours: number;
  appointmentWindowDays: number;
}

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
        value: {
          minAdvanceHours: 2,
          appointmentWindowDays: 15,
        },
      });
    }
  }

  async getConfig(): Promise<GlobalConfig | undefined> {
    const config = await this.configRepository.findOne({
      where: { key: 'appointment_rules' },
    });
    return config?.value as GlobalConfig | undefined;
  }

  async updateConfig(data: GlobalConfig): Promise<GlobalConfig | undefined> {
    const existing = await this.configRepository.findOne({
      where: { key: 'appointment_rules' },
    });
    if (existing) {
      await this.configRepository.update(
        { key: 'appointment_rules' },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        { value: data as any },
      );
    }
    return this.getConfig();
  }
}
