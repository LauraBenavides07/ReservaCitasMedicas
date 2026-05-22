import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository, DataSource } from 'typeorm';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { Doctor } from '../src/domain/entities/doctor.entity';
import { Patient } from '../src/domain/entities/patient.entity';
import { Config } from '../src/domain/entities/config.entity';
import { User } from '../src/domain/entities/user.entity';
import { DoctorException } from '../src/domain/entities/doctor-exception.entity';
import { Appointment } from '../src/domain/entities/appointment.entity';

export interface TestSeed {
  doctor: Doctor;
}

export async function seedTestData(app: INestApplication): Promise<TestSeed> {
  const doctorRepo = app.get<Repository<Doctor>>(getRepositoryToken(Doctor));
  const configRepo = app.get<Repository<Config>>(getRepositoryToken(Config));

  const doctor = await doctorRepo.save({
    name: 'Dr. Test',
    specialty: 'Cardiología',
    scheduleStart: '08:00',
    scheduleEnd: '17:00',
    slotDuration: 30,
    lunchStart: '12:00',
    lunchEnd: '13:00',
    activeDays: '1,2,3,4,5,6,7',
  });

  await configRepo.save({
    key: 'appointment_settings',
    value: { minAdvanceHours: 2, appointmentWindowDays: 15 },
    description: 'Config test',
  });
  await configRepo.save({
    key: 'appointment_rules',
    value: { minAdvanceHours: 2, appointmentWindowDays: 15 },
  });

  return { doctor };
}

export async function cleanDatabase(app: INestApplication): Promise<void> {
  const dataSource = app.get<DataSource>(getDataSourceToken());
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.query(
    'TRUNCATE TABLE appointments, doctor_exceptions, patients, doctors, configs, users CASCADE',
  );
  await queryRunner.release();
}

export function generateTestToken(
  app: INestApplication,
  payload?: Record<string, unknown>,
): string {
  const jwtService = app.get(JwtService);
  return jwtService.sign(
    payload || {
      sub: 'test-user-id',
      email: 'test@test.com',
      preferred_username: '12345',
      realm_access: { roles: ['patient'] },
    },
  );
}

export function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

export function futureTime(): string {
  const d = new Date();
  d.setHours(d.getHours() + 4);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function nearFutureTime(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 30);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
