import { Appointment } from './appointment.entity';
import { Doctor } from './doctor.entity';
import { Patient } from './patient.entity';

describe('Appointment Entity', () => {
  it('debería crear una instancia con valores por defecto', () => {
    const appointment = new Appointment();
    appointment.id = 'uuid-1';
    appointment.appointmentDate = '2026-06-15';
    appointment.appointmentTime = '10:30';
    appointment.status = 'agendada';
    appointment.createdBy = 'admin';

    expect(appointment).toBeDefined();
    expect(appointment.id).toBe('uuid-1');
    expect(appointment.appointmentDate).toBe('2026-06-15');
    expect(appointment.appointmentTime).toBe('10:30');
    expect(appointment.status).toBe('agendada');
    expect(appointment.createdBy).toBe('admin');
  });

  it('debería aceptar relaciones con Doctor y Patient', () => {
    const doctor = new Doctor();
    doctor.id = 'd1';
    doctor.name = 'Dr. Test';

    const patient = new Patient();
    patient.id = 'p1';
    patient.firstName = 'Juan';

    const appointment = new Appointment();
    appointment.doctor = doctor;
    appointment.patient = patient;

    expect(appointment.doctor).toBe(doctor);
    expect(appointment.doctor.name).toBe('Dr. Test');
    expect(appointment.patient).toBe(patient);
    expect(appointment.patient.firstName).toBe('Juan');
  });

  it('debería aceptar createdBy como nullable', () => {
    const appointment = new Appointment();
    expect(appointment.createdBy).toBeUndefined();

    appointment.createdBy = 'receptionist';
    expect(appointment.createdBy).toBe('receptionist');
  });
});
