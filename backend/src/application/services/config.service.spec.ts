import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from './config.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Config } from '../../domain/entities/config.entity';

describe('ConfigService', () => {
  let service: ConfigService;

  const mockConfigRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        {
          provide: getRepositoryToken(Config),
          useValue: mockConfigRepository,
        },
      ],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('debería crear la configuración por defecto si no existe', async () => {
      mockConfigRepository.findOne.mockResolvedValue(null);
      await service.onModuleInit();
      expect(mockConfigRepository.save).toHaveBeenCalled();
    });

    it('no debería crear la configuración si ya existe', async () => {
      mockConfigRepository.findOne.mockResolvedValue({
        key: 'appointment_rules',
      });
      await service.onModuleInit();
      expect(mockConfigRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getConfig', () => {
    it('debería retornar la configuración', async () => {
      mockConfigRepository.findOne.mockResolvedValue({
        value: { minAdvanceHours: 2 },
      });
      const result = await service.getConfig();
      expect(result?.minAdvanceHours).toBe(2);
    });
  });

  describe('updateConfig', () => {
    it('debería actualizar la configuración', async () => {
      const existing = {
        key: 'appointment_rules',
      };
      mockConfigRepository.findOne.mockResolvedValue(existing);
      const newData = { minAdvanceHours: 4, appointmentWindowDays: 20 };

      await service.updateConfig(newData);

      expect(mockConfigRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'appointment_rules',
          value: newData,
        }),
      );
    });
  });
});
