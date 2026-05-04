import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { WhatsAppService } from './whatsapp.service';
import { TemplateService } from './template.service';

@Module({
  controllers: [NotificationsController],
  providers: [WhatsAppService, TemplateService],
})
export class NotificationsModule {}
