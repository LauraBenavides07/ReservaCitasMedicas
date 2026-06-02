import { Controller, Get, Body, Patch, UseGuards } from '@nestjs/common';
import { ConfigService } from '../../application/services/config.service';
import { UpdateConfigDto } from '../dto/update-config.dto';
import type { GlobalConfig } from '../../domain/types/global-config.type';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';

@Controller('configs')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  async getConfig(): Promise<GlobalConfig | undefined> {
    return this.configService.getConfig();
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  async updateConfig(
    @Body() data: UpdateConfigDto,
  ): Promise<GlobalConfig | undefined> {
    return this.configService.updateConfig(data);
  }
}
