import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../domain/entities/user.entity';
import { Patient } from '../../domain/entities/patient.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../../presentation/dto/login.dto';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockUserRepository = {
    findOne: jest.fn(),
  };
  const mockPatientRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        {
          provide: getRepositoryToken(Patient),
          useValue: mockPatientRepository,
        },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // 6. Validar usuario correcto
  it('debería validar usuario correctamente', async () => {
    const mockUser = {
      id: 1,
      email: 'test@mail.com',
      password: '123456',
    };

    // Configurar repuestas de mocks para simular que el usuario existe y la contraseña coincide
    mockUserRepository.findOne.mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    mockJwtService.sign.mockReturnValue('fake-token');

    const result = await service.login({
      login: 'test@mail.com',
      password: '123456',
    } as unknown as LoginDto);

    expect(result).toBeDefined();
    expect(result.user.email).toBe('test@mail.com');
  });

  // 7. Login genera token
  it('debería generar un token al hacer login', async () => {
    mockUserRepository.findOne.mockResolvedValue({
      id: 1,
      email: 'test@mail.com',
      password: 'hash',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    mockJwtService.sign.mockReturnValue('fake-token');

    const result = await service.login({
      login: 'test@mail.com',
      password: '123456',
    } as unknown as LoginDto);

    expect(result.access_token).toBe('fake-token');
  });

  // 8. Usuario inválido (login falla)
  it('debería fallar si el usuario no existe', async () => {
    mockUserRepository.findOne.mockResolvedValue(null);
    mockPatientRepository.findOne.mockResolvedValue(null);

    await expect(
      service.login({
        login: 'fake@mail.com',
        password: '123456',
      } as unknown as LoginDto),
    ).rejects.toThrow();
  });
});
