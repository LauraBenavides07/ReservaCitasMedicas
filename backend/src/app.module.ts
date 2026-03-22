import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from './domain/entities/doctor.entity';
import { Patient } from './domain/entities/patient.entity';
import { Appointment } from './domain/entities/appointment.entity';
import { AppointmentService } from './application/services/appointment.service';
import { AppointmentController } from './presentation/controllers/appointment.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [Doctor, Patient, Appointment],
      synchronize: true, // Solo para desarrollo
    }),
    TypeOrmModule.forFeature([Doctor, Patient, Appointment]),
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService],
})
export class AppModule {}
