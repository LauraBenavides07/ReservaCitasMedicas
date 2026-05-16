import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../domain/entities/user.entity';
import { Patient } from '../../domain/entities/patient.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../../presentation/dto/login.dto';
import { RegisterDto } from '../../presentation/dto/register.dto';
import axios from 'axios';
import { UnauthorizedException, ConflictException, InternalServerErrorException } from '@nestjs/common';

jest.mock('bcrypt');
jest.mock('axios');

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(Patient), useValue: mockPatientRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('debería hacer login exitoso vía Keycloak', async () => {
      (axios.post as jest.Mock).mockResolvedValue({ data: { access_token: 'tk-123' } });
      mockJwtService.decode.mockReturnValue({ sub: 'uuid-kc' });
      mockPatientRepository.findOneBy.mockResolvedValue({ id: 'p1', keycloakId: 'uuid-kc', document: '123' });

      const result = await service.login({ login: '123', password: 'pwd' } as LoginDto);
      
      expect(result.access_token).toBe('tk-123');
      expect(result.source).toBe('keycloak');
    });

    it('debería fallar si no existe en Keycloak ni localmente', async () => {
      (axios.post as jest.Mock).mockRejectedValue(new Error('Auth failed'));
      mockPatientRepository.findOne.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login({ login: 'none', password: 'pwd' } as LoginDto))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('debería registrar un nuevo paciente y sincronizar con Keycloak', async () => {
      mockPatientRepository.findOneBy.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'p1', document: '123' });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pwd');
      mockPatientRepository.create.mockReturnValue({ id: 'p1' });
      
      (axios.post as jest.Mock)
        .mockResolvedValueOnce({ data: { access_token: 'admin-tk' } }) 
        .mockResolvedValueOnce({}) 
        .mockResolvedValueOnce({ data: { access_token: 'user-tk' } });

      mockJwtService.decode.mockReturnValue({ sub: 'uuid' });

      const dto: RegisterDto = { document: '123', firstName: 'A', lastName: 'B', email: 'a@a.com', password: 'pwd', phone: '1', gender: 'M' };
      const result = await service.register(dto);

      expect(result.access_token).toBe('user-tk');
    });

    it('debería registrar localmente pero fallar el login final si Keycloak está caído', async () => {
      mockPatientRepository.findOneBy.mockResolvedValueOnce(null); // register check
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pwd');
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPatientRepository.create.mockReturnValue({ id: 'p1' });
      mockPatientRepository.findOne.mockResolvedValue({ id: 'p1', password: 'hashed_pwd' }); // fallback check
      
      (axios.post as jest.Mock).mockRejectedValue(new Error('Keycloak Down')); 

      const dto: RegisterDto = { document: '123', password: 'pwd' } as any;
      
      // Debe fallar con InternalServerError porque el login automático post-registro falla al no haber Keycloak
      await expect(service.register(dto)).rejects.toThrow(InternalServerErrorException);
      expect(mockPatientRepository.save).toHaveBeenCalled();
    });
  });

  describe('getPatientByDocument', () => {
    it('debería retornar paciente si existe', async () => {
      mockPatientRepository.findOne.mockResolvedValue({ id: 'p1', document: '123' });
      const result = await service.getPatientByDocument('123');
      expect(result.id).toBe('p1');
    });

    it('debería lanzar UnauthorizedException si no existe', async () => {
      mockPatientRepository.findOne.mockResolvedValue(null);
      await expect(service.getPatientByDocument('000')).rejects.toThrow(UnauthorizedException);
    });
  });
});
