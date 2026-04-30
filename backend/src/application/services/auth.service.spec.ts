import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../domain/entities/user.entity';
import { Patient } from '../../domain/entities/patient.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../../presentation/dto/login.dto';
import axios from 'axios';

jest.mock('bcrypt');
jest.mock('axios');

describe('AuthService', () => {
  let service: AuthService;

  const mockUserRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
  };
  const mockPatientRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const mockJwtService = {
    sign: jest.fn(),
    decode: jest.fn(),
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
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería validar usuario correctamente', async () => {
    const mockUser = {
      id: 1,
      email: 'test@mail.com',
      password: '123456',
    };

    // Mock Keycloak response
    (axios.post as jest.Mock).mockResolvedValue({
      data: {
        access_token: 'fake-keycloak-token',
      },
    });

    mockJwtService.decode.mockReturnValue({
      sub: 'keycloak-uuid-123',
    });

    mockPatientRepository.findOneBy.mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    mockJwtService.sign.mockReturnValue('fake-token');

    const result = await service.login({
      login: 'test@mail.com',
      password: '123456',
    } as unknown as LoginDto);

    expect(result).toBeDefined();
    expect(result.user).toBeDefined();
    expect(result.access_token).toBe('fake-keycloak-token');
  });

  it('debería generar un token al hacer login', async () => {
    (axios.post as jest.Mock).mockResolvedValue({
      data: {
        access_token: 'fake-keycloak-token',
      },
    });

    mockJwtService.decode.mockReturnValue({
      sub: 'keycloak-uuid-123',
    });

    mockPatientRepository.findOneBy.mockResolvedValue({
      id: 1,
      email: 'test@mail.com',
      password: 'hash',
    });

    const result = await service.login({
      login: 'test@mail.com',
      password: '123456',
    } as unknown as LoginDto);

    expect(result.access_token).toBe('fake-keycloak-token');
  });

  it('debería fallar si el usuario no existe', async () => {
    (axios.post as jest.Mock).mockResolvedValue({
      data: {
        access_token: 'fake-keycloak-token',
      },
    });

    mockJwtService.decode.mockReturnValue({
      sub: 'keycloak-uuid-123',
    });

    mockPatientRepository.findOneBy.mockResolvedValue(null);
    mockUserRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.login({
        login: 'fake@mail.com',
        password: '123456',
      } as unknown as LoginDto),
    ).rejects.toThrow();
  });
});
