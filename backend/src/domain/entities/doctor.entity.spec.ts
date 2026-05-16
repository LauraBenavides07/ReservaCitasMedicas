import { Doctor } from './doctor.entity';

describe('Doctor Entity', () => {
  it('debería crear una instancia con valores por defecto', () => {
    const doctor = new Doctor();
    doctor.id = 'd1';
    doctor.name = 'Dr. Pérez';

    expect(doctor).toBeDefined();
    expect(doctor.id).toBe('d1');
    expect(doctor.name).toBe('Dr. Pérez');
  });

  it('debería aceptar specialty nullable', () => {
    const doctor = new Doctor();
    expect(doctor.specialty).toBeUndefined();
    doctor.specialty = 'Cardiología';
    expect(doctor.specialty).toBe('Cardiología');
  });

  it('debería aceptar horario de almuerzo nullable', () => {
    const doctor = new Doctor();
    expect(doctor.lunchStart).toBeUndefined();
    expect(doctor.lunchEnd).toBeUndefined();

    doctor.lunchStart = '12:00';
    doctor.lunchEnd = '13:00';
    expect(doctor.lunchStart).toBe('12:00');
    expect(doctor.lunchEnd).toBe('13:00');
  });

  it('debería permitir modificar slotDuration', () => {
    const doctor = new Doctor();
    doctor.slotDuration = 15;
    expect(doctor.slotDuration).toBe(15);
  });
});
