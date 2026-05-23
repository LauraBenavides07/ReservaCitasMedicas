import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../../application/services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    getPatientByDocument: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('debería llamar a authService.register', async () => {
      const dto: RegisterDto = { document: '123' } as any;
      const mockResponse = {
        access_token: 'tk',
        user: { id: 'p1' },
        source: 'keycloak',
      };
      const spy = jest.spyOn(service, 'register');
      spy.mockResolvedValue(mockResponse);

      const result = await controller.register(dto);
      expect(result.access_token).toBe('tk');
      expect(spy).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('debería llamar a authService.login', async () => {
      const dto: LoginDto = { login: '123', password: 'pwd' };
      const spy = jest.spyOn(service, 'login');
      spy.mockResolvedValue({ access_token: 'tk' });

      const result = await controller.login(dto);
      expect(result.access_token).toBe('tk');
      expect(spy).toHaveBeenCalledWith(dto);
    });
  });

  describe('getPatientByDocument', () => {
    it('debería llamar a authService.getPatientByDocument', async () => {
      mockAuthService.getPatientByDocument.mockResolvedValue({ id: 'p1' });
      const result = await controller.getPatientByDocument('123');
      expect(result.id).toBe('p1');
      expect(service.getPatientByDocument).toHaveBeenCalledWith('123');
    });
  });
});
