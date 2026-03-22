import { DataSource } from 'typeorm';
import { Doctor } from './src/domain/entities/doctor.entity';
import { Patient } from './src/domain/entities/patient.entity';
import { Appointment } from './src/domain/entities/appointment.entity';

const dataSource = new DataSource({
  type: 'sqlite',
  database: 'database.sqlite',
  entities: [Doctor, Patient, Appointment],
  synchronize: true,
});

async function seed() {
  try {
    await dataSource.initialize();
    console.log('DataSource initialized');

    const doctorRepo = dataSource.getRepository(Doctor);
    const patientRepo = dataSource.getRepository(Patient);
    const appointmentRepo = dataSource.getRepository(Appointment);

    // Limpiar datos
    await appointmentRepo.delete({});
    await patientRepo.delete({});
    await doctorRepo.delete({});

    // Crear Doctor
    const doctor = doctorRepo.create({
      id: 1,
      name: 'Dr. Gregory House',
      specialty: 'Diagnóstico',
    });
    await doctorRepo.save(doctor);

    // Crear Paciente
    const patient = patientRepo.create({
      id: 1,
      document: '12345678',
      firstName: 'John',
      lastName: 'Doe',
      phone: '555-0199',
      gender: 'Hombre',
    });
    await patientRepo.save(patient);

    // Crear Cita para hoy
    const today = new Date().toISOString().split('T')[0];
    const appointment = appointmentRepo.create({
      date: today,
      time: '09:00',
      status: 'agendada',
      doctor: doctor,
      patient: patient,
    });
    await appointmentRepo.save(appointment);

    console.log(`Seed exitoso. Doctor ID: ${doctor.id}, Fecha: ${today}`);
  } catch (error) {
    console.error('Error durante el seed:', error);
  } finally {
    await dataSource.destroy();
  }
}

seed();
