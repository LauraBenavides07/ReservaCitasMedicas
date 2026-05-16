import { DoctorException } from './doctor-exception.entity';
import { Doctor } from './doctor.entity';

describe('DoctorException Entity', () => {
  it('debería crear una instancia con campos básicos', () => {
    const exception = new DoctorException();
    exception.id = 'e1';
    exception.doctorId = 'd1';
    exception.date = '2026-06-20';
    exception.reason = 'Vacaciones';

    expect(exception).toBeDefined();
    expect(exception.id).toBe('e1');
    expect(exception.doctorId).toBe('d1');
    expect(exception.date).toBe('2026-06-20');
    expect(exception.reason).toBe('Vacaciones');
  });

  it('debería aceptar reason como nullable', () => {
    const exception = new DoctorException();
    expect(exception.reason).toBeUndefined();
  });

  it('debería aceptar relación con Doctor', () => {
    const doctor = new Doctor();
    doctor.id = 'd1';
    doctor.name = 'Dr. Test';

    const exception = new DoctorException();
    exception.doctor = doctor;

    expect(exception.doctor).toBe(doctor);
    expect(exception.doctor.name).toBe('Dr. Test');
  });
});
