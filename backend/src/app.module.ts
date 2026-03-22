import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { ConfigService } from './application/services/config.service';
import { AuthModule } from './auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [Doctor, Patient, Appointment, Config, User],
      synchronize: true, // Solo para desarrollo
    }),
    TypeOrmModule.forFeature([Doctor, Patient, Appointment, Config, User]),
    AuthModule,
  ],
  controllers: [AppointmentController, DoctorController, ConfigController],
  providers: [AppointmentService, DoctorService, ConfigService],
})
export class AppModule {}
