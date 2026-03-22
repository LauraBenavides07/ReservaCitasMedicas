import { Controller, Get, Body, Patch } from '@nestjs/common';
import { ConfigService } from '../../application/services/config.service';

@Controller('configs')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  async getConfig() {
    return this.configService.getConfig();
  }

  @Patch()
  async updateConfig(@Body() data: any) {
    return this.configService.updateConfig(data);
  }
}
