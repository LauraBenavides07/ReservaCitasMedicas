import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Doctor } from './domain/entities/doctor.entity';
import { Patient } from './domain/entities/patient.entity';
import { Appointment } from './domain/entities/appointment.entity';
import { Config } from './domain/entities/config.entity';
import { User } from './domain/entities/user.entity';
import { DoctorException } from './domain/entities/doctor-exception.entity';
import { ConfigController } from './presentation/controllers/config.controller';
import { AppointmentController } from './presentation/controllers/appointment.controller';
import { DoctorController } from './presentation/controllers/doctor.controller';
import { AppointmentService } from './application/services/appointment.service';
import { DoctorService } from './application/services/doctor.service';
import { ConfigService as AppConfigService } from './application/services/config.service';
import { AuthModule } from './auth.module';
import { NotificationsClientModule } from './infrastructure/messaging/notifications-client.module';

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
        type: 'postgres' as const,
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [Doctor, Patient, Appointment, Config, User, DoctorException],
        synchronize: true,
        logging: true,
      }),
    }),
    TypeOrmModule.forFeature([Doctor, Patient, Appointment, Config, User, DoctorException]),
    AuthModule,
    ScheduleModule.forRoot(),
    NotificationsClientModule,
  ],
  controllers: [AppointmentController, DoctorController, ConfigController],
  providers: [AppointmentService, DoctorService, AppConfigService],
})
export class AppModule {}