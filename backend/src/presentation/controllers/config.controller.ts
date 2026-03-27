import { Controller, Get, Body, Patch } from '@nestjs/common';
import {
  ConfigService,
  GlobalConfig,
} from '../../application/services/config.service';

@Controller('configs')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  async getConfig(): Promise<GlobalConfig | undefined> {
    return this.configService.getConfig();
  }

  @Patch()
  async updateConfig(
    @Body() data: GlobalConfig,
  ): Promise<GlobalConfig | undefined> {
    return this.configService.updateConfig(data);
  }
}
