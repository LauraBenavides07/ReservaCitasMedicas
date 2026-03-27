import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Doctor } from './src/domain/entities/doctor.entity';
import { Patient } from './src/domain/entities/patient.entity';
import { Appointment } from './src/domain/entities/appointment.entity';
import { User, UserRole } from './src/domain/entities/user.entity';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'piedrazul',
  entities: [Doctor, Patient, Appointment, User],
  synchronize: true,
});

async function seed() {
  try {
    await dataSource.initialize();
    console.log('DataSource initialized. Connected to PostgreSQL.');

    const doctorRepo = dataSource.getRepository(Doctor);
    const patientRepo = dataSource.getRepository(Patient);
    const appointmentRepo = dataSource.getRepository(Appointment);
    const userRepo = dataSource.getRepository(User);

    // Limpiar datos
    await dataSource.query('TRUNCATE TABLE appointments, patients, doctors, users CASCADE;');

    const commonPasswordHash = await bcrypt.hash('123456', 10);

    // Crear Admin
    const admin = userRepo.create({
      email: 'admin@piedrazul.com',
      password: commonPasswordHash,
      firstName: 'Admin',
      lastName: 'System',
      role: UserRole.ADMIN,
    });
    await userRepo.save(admin);

    // Crear Doctor (User)
    const doctorUser = userRepo.create({
      email: 'medico@piedrazul.com',
      password: commonPasswordHash,
      firstName: 'Medico',
      lastName: 'Prueba',
      role: UserRole.DOCTOR,
    });
    await userRepo.save(doctorUser);

    // Crear Doctor (Entity para turnos)
    const doctor = doctorRepo.create({
      name: 'Dr. Medico Prueba',
      specialty: 'Cardiología',
      scheduleStart: '08:00',
      scheduleEnd: '18:00',
      slotDuration: 30,
    });
    await doctorRepo.save(doctor);

    // Crear Paciente
    const patient = patientRepo.create({
      document: '123456789',
      firstName: 'Paciente',
      lastName: 'Prueba',
      phone: '3000000000',
      gender: 'Mujer',
      email: 'paciente@piedrazul.com',
      password: commonPasswordHash,
    });
    await patientRepo.save(patient);

    // Crear Cita para hoy
    const today = new Date().toISOString().split('T')[0];
    const appointment = appointmentRepo.create({
      appointmentDate: today,
      appointmentTime: '09:00',
      status: 'agendada',
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
