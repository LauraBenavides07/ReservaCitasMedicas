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
    // Asegurar que exista al menos una configuración
    const count = await this.configRepository.count();
    if (count === 0) {
      await this.configRepository.save({
        minAdvanceHours: 2,
        maxFutureDays: 30,
      });
    }
  }

  async getConfig() {
    return this.configRepository.findOne({ where: { id: 1 } });
  }

  async updateConfig(data: Partial<Config>) {
    await this.configRepository.update(1, data);
    return this.getConfig();
  }
}
