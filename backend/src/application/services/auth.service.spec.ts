import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../domain/entities/user.entity';
import { Patient } from '../../domain/entities/patient.entity';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../../presentation/dto/login.dto';
import { RegisterDto } from '../../presentation/dto/register.dto';
import {
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { IPasswordHasher } from '../abstractions/ipassword-hasher.interface';
import { KeycloakService } from '../../infrastructure/auth/keycloak.service';
import { IPatientRepository } from '../ports/patient.repository';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
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
  const mockPasswordHasher = {
    hash: jest.fn(),
    compare: jest.fn(),
  };
  const mockKeycloakService = {
    login: jest.fn(),
    createUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: IPatientRepository, useValue: mockPatientRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: IPasswordHasher, useValue: mockPasswordHasher },
        { provide: KeycloakService, useValue: mockKeycloakService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('debería hacer login exitoso vía Keycloak para paciente', async () => {
      mockKeycloakService.login.mockResolvedValue({
        access_token: 'mock-keycloak-token',
      });
      mockJwtService.decode.mockReturnValue({
        sub: 'kc-sub-123',
        preferred_username: 'doc-123',
      });

      mockPatientRepository.findOneBy.mockResolvedValue({
        id: 'patient-1',
        document: 'doc-123',
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@example.com',
        keycloakId: null,
      });

      const dto: LoginDto = { login: 'doc-123', password: 'pass123' };
      const result = await service.login(dto);
      expect(result.access_token).toBe('mock-keycloak-token');
      expect(result.source).toBe('keycloak');
      expect(result.user?.role).toBe('patient');
    });

    it('debería hacer lazy identity linking si keycloakId es null', async () => {
      mockKeycloakService.login.mockResolvedValue({ access_token: 'token' });
      mockJwtService.decode.mockReturnValue({
        sub: 'kc-sub-456',
        preferred_username: 'doc-456',
      });

      mockPatientRepository.findOneBy.mockResolvedValue({
        id: 'patient-2',
        document: 'doc-456',
        firstName: 'Ana',
        lastName: 'López',
        email: 'ana@example.com',
        keycloakId: null,
      });

      await service.login({ login: 'doc-456', password: 'pass456' });
      expect(mockPatientRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ keycloakId: 'kc-sub-456' }),
      );
    });

    it('debería hacer login exitoso para staff/user', async () => {
      mockKeycloakService.login.mockResolvedValue({ access_token: 'token' });
      mockJwtService.decode.mockReturnValue({
        sub: 'kc-sub-staff',
        preferred_username: 'staff@test.com',
      });

      mockPatientRepository.findOneBy.mockResolvedValue(null);
      mockUserRepository.findOneBy.mockResolvedValue({
        id: 'staff-1',
        email: 'staff@test.com',
        firstName: 'Admin',
        lastName: 'User',
        keycloakId: null,
        role: 'admin',
      });

      const result = await service.login({
        login: 'staff@test.com',
        password: 'pass',
      });
      expect(result.user?.role).toBe('admin');
    });

    it('debería lanzar error si el usuario no está en BD local', async () => {
      mockKeycloakService.login.mockResolvedValue({ access_token: 'token' });
      mockJwtService.decode.mockReturnValue({ sub: 'kc-sub' });

      mockPatientRepository.findOneBy.mockResolvedValue(null);
      mockUserRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.login({ login: 'unknown', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debería hacer fallback a local si Keycloak falla', async () => {
      mockKeycloakService.login.mockRejectedValue(
        new Error('Keycloak not reachable'),
      );

      mockPasswordHasher.compare.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('mock-local-token');

      mockPatientRepository.findOne.mockResolvedValue({
        id: 'p1',
        firstName: 'J',
        lastName: 'P',
        password: 'hashed',
        document: 'doc-fallback',
        email: 'j@example.com',
      });

      const result = await service.login({
        login: 'doc-fallback',
        password: 'pass',
      });

      expect(result.source).toBe('local');
      expect(result.access_token).toBe('mock-local-token');
      expect(result.user?.id).toBe('p1');
    });
  });

  describe('register', () => {
    it('debería registrar un nuevo paciente exitosamente', async () => {
      mockPatientRepository.findOneBy.mockResolvedValue(null);
      mockPasswordHasher.hash.mockResolvedValue('hashed-pass');
      mockPatientRepository.create.mockReturnValue({
        id: 'p1',
        document: 'new-doc',
      });
      mockPatientRepository.save.mockResolvedValue({
        id: 'p1',
        document: 'new-doc',
      });

      mockKeycloakService.createUser.mockResolvedValue(undefined);
      mockKeycloakService.login.mockResolvedValue({
        access_token: 'user-token',
      });

      mockJwtService.decode.mockReturnValue({
        sub: 'kc-sub-new',
        preferred_username: 'new-doc',
      });

      mockPatientRepository.findOneBy
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'p1',
          document: 'new-doc',
          firstName: 'Nuevo',
          lastName: 'Paciente',
          email: 'nuevo@test.com',
          keycloakId: null,
        });

      const dto: RegisterDto = {
        document: 'new-doc',
        firstName: 'Nuevo',
        lastName: 'Paciente',
        phone: '3000000000',
        gender: 'M',
        email: 'nuevo@test.com',
        password: 'securePass1',
      };

      const result = await service.register(dto);
      expect(result.access_token).toBe('user-token');
      expect(mockPasswordHasher.hash).toHaveBeenCalledWith('securePass1');
    });

    it('debería lanzar ConflictException si el documento ya existe', async () => {
      mockPatientRepository.findOneBy.mockResolvedValue({
        id: 'p1',
        document: 'existing',
      });

      await expect(
        service.register({
          document: 'existing',
          firstName: 'A',
          lastName: 'B',
          phone: '300',
          gender: 'M',
          password: 'pass',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getPatientByDocument', () => {
    it('debería retornar paciente si existe', async () => {
      mockPatientRepository.findOne.mockResolvedValue({
        id: 'p1',
        firstName: 'Juan',
        lastName: 'Pérez',
        document: '123',
        phone: '300',
        gender: 'M',
      });
      const result = await service.getPatientByDocument('123');
      expect(result.firstName).toBe('Juan');
    });

    it('debería lanzar error si no existe', async () => {
      mockPatientRepository.findOne.mockResolvedValue(null);
      await expect(service.getPatientByDocument('000')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
