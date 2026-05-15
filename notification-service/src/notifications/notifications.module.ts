import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { WhatsAppService } from './whatsapp.service';
import { EmailService } from './email.service';
import { TemplateService } from './template.service';
import { NotificationLog } from './notification-log.entity';
import { NotificationLogService } from './notification-log.service';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationLog])],
  controllers: [NotificationsController],
  providers: [
    WhatsAppService,
    EmailService,
    TemplateService,
    NotificationLogService,
  ],
})
export class NotificationsModule {}