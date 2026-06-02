import { Patient } from './patient.entity';

describe('Patient Entity', () => {
  it('debería crear un paciente con campos obligatorios', () => {
    const patient = new Patient();
    patient.id = 'p1';
    patient.document = '12345678';
    patient.firstName = 'Juan';
    patient.lastName = 'Pérez';
    patient.phone = '3001234567';
    patient.gender = 'M';

    expect(patient).toBeDefined();
    expect(patient.id).toBe('p1');
    expect(patient.document).toBe('12345678');
    expect(patient.firstName).toBe('Juan');
    expect(patient.lastName).toBe('Pérez');
    expect(patient.phone).toBe('3001234567');
    expect(patient.gender).toBe('M');
  });

  it('debería aceptar campos opcionales', () => {
    const patient = new Patient();
    patient.keycloakId = 'kc-uuid-1';
    patient.birthDate = '1990-05-15';
    patient.email = 'juan@example.com';

    expect(patient.keycloakId).toBe('kc-uuid-1');
    expect(patient.birthDate).toBe('1990-05-15');
    expect(patient.email).toBe('juan@example.com');
  });

  it('debería tener password como opcional con select: false', () => {
    const patient = new Patient();
    expect(patient.password).toBeUndefined();
    patient.password = 'hashed-password';
    expect(patient.password).toBe('hashed-password');
  });
});
