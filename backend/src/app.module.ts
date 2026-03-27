import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Doctor } from './domain/entities/doctor.entity';
import { Patient } from './domain/entities/patient.entity';
import { Appointment } from './domain/entities/appointment.entity';
import { Config } from './domain/entities/config.entity';
import { User } from './domain/entities/user.entity';
import { ConfigController } from './presentation/controllers/config.controller';
import { AppointmentController } from './presentation/controllers/appointment.controller';
import { DoctorController } from './presentation/controllers/doctor.controller';
import { AppointmentService } from './application/services/appointment.service';
import { DoctorService } from './application/services/doctor.service';
import { ConfigService as AppConfigService } from './application/services/config.service';
import { AuthModule } from './auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_DATABASE', 'piedrazul'),
        entities: [Doctor, Patient, Appointment, Config, User],
        synchronize: true, // Solo para desarrollo
      }),
    }),
    TypeOrmModule.forFeature([Doctor, Patient, Appointment, Config, User]),
    AuthModule,
  ],
  controllers: [AppointmentController, DoctorController, ConfigController],
  providers: [AppointmentService, DoctorService, AppConfigService],
})
export class AppModule {}
