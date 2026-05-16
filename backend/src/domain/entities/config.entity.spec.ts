import { Config } from './config.entity';

describe('Config Entity', () => {
  it('debería crear una instancia con valores', () => {
    const config = new Config();
    config.id = 'c1';
    config.key = 'appointment_settings';
    config.value = { minAdvanceHours: 2, appointmentWindowDays: 15 };
    config.description = 'Configuración de ventanas de tiempo';

    expect(config).toBeDefined();
    expect(config.id).toBe('c1');
    expect(config.key).toBe('appointment_settings');
    expect(config.value).toEqual({ minAdvanceHours: 2, appointmentWindowDays: 15 });
    expect(config.description).toBe('Configuración de ventanas de tiempo');
  });

  it('debería aceptar description nullable', () => {
    const config = new Config();
    expect(config.description).toBeUndefined();
  });

  it('debería almacenar value como jsonb (any)', () => {
    const config = new Config();
    config.value = { nested: { key: 'val' }, numbers: [1, 2, 3] };
    expect(config.value.nested.key).toBe('val');
    expect(config.value.numbers).toHaveLength(3);
  });
});
