import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from './notifications/notifications.module';
import { NotificationLog } from './notifications/notification-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_NOTIFICATIONS_HOST', 'localhost'),
        port: configService.get<number>('DB_NOTIFICATIONS_PORT', 5433),
        username: configService.get<string>('DB_NOTIFICATIONS_USERNAME', 'postgres'),
        password: configService.get<string>('DB_NOTIFICATIONS_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_NOTIFICATIONS_DATABASE', 'notifications_db'),
        entities: [NotificationLog],
        synchronize: true,  // Solo para desarrollo
        logging: false,
      }),
    }),
    NotificationsModule,
  ],
})
export class AppModule {}