import { Controller, Get, Body, Patch } from '@nestjs/common';
import { ConfigService } from '../../application/services/config.service';
import { UpdateConfigDto } from '../dto/update-config.dto';
import type { GlobalConfig } from '../../domain/types/global-config.type';

@Controller('configs')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  async getConfig(): Promise<GlobalConfig | undefined> {
    return this.configService.getConfig();
  }

  @Patch()
  async updateConfig(
    @Body() data: UpdateConfigDto,
  ): Promise<GlobalConfig | undefined> {
    return this.configService.updateConfig(data);
  }
}
