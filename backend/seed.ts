import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Doctor } from './src/domain/entities/doctor.entity';
import { Patient } from './src/domain/entities/patient.entity';
import { Appointment } from './src/domain/entities/appointment.entity';
import { AppointmentHistory } from './src/domain/entities/appointment-history.entity';
import { DoctorException } from './src/domain/entities/doctor-exception.entity';
import { Config } from './src/domain/entities/config.entity';
import { User, UserRole } from './src/domain/entities/user.entity';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { AppointmentStatus } from './src/domain/types/appointment-status.enum';
dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'piedrazul',
  entities: [Doctor, Patient, Appointment, User, AppointmentHistory, DoctorException, Config],
  synchronize: false,
  migrations: ['src/migrations/*.ts'],
});

async function seed() {
  try {
    await dataSource.initialize();
    console.log('DataSource initialized. Connected to PostgreSQL.');

    // Ejecutar migrations antes de seedear
    await dataSource.runMigrations();
    console.log('Migrations executed successfully.');

    const doctorRepo = dataSource.getRepository(Doctor);
    const patientRepo = dataSource.getRepository(Patient);
    const appointmentRepo = dataSource.getRepository(Appointment);
    const userRepo = dataSource.getRepository(User);

    // Limpiar datos
    await dataSource.query('TRUNCATE TABLE appointments, doctor_exceptions, patients, doctors, configs, users CASCADE;');

    const commonPasswordHash = await bcrypt.hash('123456', 10);

    // Crear Admin
    const admin = userRepo.create({
      email: 'admin@piedrazul.com',
      password: commonPasswordHash,
      firstName: 'Sofia',
      lastName: 'Paz',
      role: UserRole.ADMIN,
    });
    await userRepo.save(admin);

    // Crear Doctor (User)
    const doctorUser = userRepo.create({
      email: 'medico@piedrazul.com',
      password: commonPasswordHash,
      firstName: 'Juan',
      lastName: 'Lopez',
      role: UserRole.DOCTOR,
    });
    await userRepo.save(doctorUser);

    // Crear Doctor (Entity para turnos)
    const doctor = doctorRepo.create({
      document: '987654321',
      name: 'Juan Lopez',
      specialty: 'Cardiología',
      email: 'medico@piedrazul.com',
      user: doctorUser,
      scheduleStart: '08:00',
      scheduleEnd: '18:00',
      slotDuration: 30,
    });
    await doctorRepo.save(doctor);

    // Crear Paciente
    const patient = patientRepo.create({
      document: '123456789',
      firstName: 'Luisa',
      lastName: 'Perez',
      phone: '3000000000',
      gender: 'F',
      email: 'paciente@piedrazul.com',
      password: commonPasswordHash,
    });
    await patientRepo.save(patient);

    // Crear Cita para hoy
    const today = new Date().toISOString().split('T')[0];
    const appointment = appointmentRepo.create({
      appointmentDate: today,
      appointmentTime: '09:00',
      status: AppointmentStatus.SCHEDULED,  
      doctor: doctor,
      patient: patient,
    });
    await appointmentRepo.save(appointment);

    console.log(`Seed exitoso.`);
    console.log(`- Administrador: admin@piedrazul.com / 123456`);
    console.log(`- Médico: medico@piedrazul.com / 123456`);
    console.log(`- Paciente (Documento/Email): 123456789 o paciente@piedrazul.com / 123456`);
  } catch (error) {
    console.error('Error durante la conexión o inserción de datos (seed):', error);
  } finally {
    await dataSource.destroy();
  }
}

seed();
