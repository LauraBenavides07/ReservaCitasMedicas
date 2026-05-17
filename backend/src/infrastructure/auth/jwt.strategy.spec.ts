import { JwtStrategy } from './jwt.strategy';
import { UnauthorizedException } from '@nestjs/common';

jest.mock('jwks-rsa', () => ({
  passportJwtSecret: jest.fn(),
}));

jest.mock('passport-jwt', () => ({
  Strategy: class {},
  ExtractJwt: {
    fromAuthHeaderAsBearerToken: jest.fn(),
  },
}));

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const mockPatientRepository = {
    findOneBy: jest.fn(),
  };
  const mockUserRepository = {
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    // Evitar llamar al constructor que usa dependencias ESM problemáticas
    strategy = Object.create(JwtStrategy.prototype);
    (strategy as any).patientRepository = mockPatientRepository;
    (strategy as any).userRepository = mockUserRepository;
  });

  it('debería estar definido', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('debería validar y retornar datos de paciente', async () => {
      const payload = {
        sub: 'uuid-1',
        email: 'test@test.com',
        preferred_username: '123',
        realm_access: { roles: ['patient'] }
      };
      mockPatientRepository.findOneBy.mockResolvedValue({ id: 'local-p1' });

      const result = await strategy.validate(payload as any);
      expect(result.id).toBe('local-p1');
      expect(result.roles).toContain('patient');
    });

    it('debería validar y retornar datos de staff', async () => {
      const payload = {
        sub: 'uuid-2',
        email: 'admin@test.com',
        preferred_username: 'admin@test.com',
        realm_access: { roles: ['admin'] }
      };
      mockPatientRepository.findOneBy.mockResolvedValue(null);
      mockUserRepository.findOneBy.mockResolvedValue({ id: 'local-s1' });

      const result = await strategy.validate(payload as any);
      expect(result.id).toBe('local-s1');
      expect(result.roles).toContain('admin');
    });

    it('debería retornar fallback sub si no existe en BD local', async () => {
      const payload = {
        sub: 'uuid-unknown',
        email: 'unknown@test.com',
        preferred_username: 'unknown',
        realm_access: { roles: [] }
      };
      mockPatientRepository.findOneBy.mockResolvedValue(null);
      mockUserRepository.findOneBy.mockResolvedValue(null);

      const result = await strategy.validate(payload as any);
      expect(result.id).toBe('uuid-unknown');
    });

    it('debería manejar roles vacíos', async () => {
        const payload = {
            sub: 'uuid-1',
            preferred_username: 'user',
            realm_access: null
        };
        mockPatientRepository.findOneBy.mockResolvedValue(null);
        mockUserRepository.findOneBy.mockResolvedValue(null);
        const result = await strategy.validate(payload as any);
        expect(result.roles).toEqual([]);
    });

    it('debería lanzar UnauthorizedException si no hay payload', async () => {
      await expect(strategy.validate(null as any)).rejects.toThrow(UnauthorizedException);
    });
  });
});
