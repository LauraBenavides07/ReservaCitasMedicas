import { BcryptPasswordHasher } from './bcrypt-password-hasher';
import bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('BcryptPasswordHasher', () => {
  let hasher: BcryptPasswordHasher;

  beforeEach(() => {
    hasher = new BcryptPasswordHasher();
    jest.clearAllMocks();
  });

  describe('hash', () => {
    it('debería hashear una contraseña', async () => {
      const result = await hasher.hash('miPassword123');
      expect(result).toBe('$2b$10$hashed_password');
    });
  });

  describe('compare', () => {
    it('debería retornar true si la contraseña coincide', async () => {
      const result = await hasher.compare(
        'miPassword123',
        '$2b$10$hashed_password',
      );
      expect(result).toBe(true);
    });

    it('debería retornar false si la contraseña no coincide', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      const result = await hasher.compare(
        'wrongPassword',
        '$2b$10$hashed_password',
      );
      expect(result).toBe(false);
    });
  });
});
