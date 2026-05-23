import { Test, TestingModule } from '@nestjs/testing';
import { ConfigController } from './config.controller';
import { ConfigService } from '../../application/services/config.service';

describe('ConfigController', () => {
  let controller: ConfigController;
  let service: ConfigService;

  const mockConfigService = {
    getConfig: jest.fn(),
    updateConfig: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigController],
      providers: [
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<ConfigController>(ConfigController);
    service = module.get<ConfigService>(ConfigService);
  });

  it('debería obtener la configuración', async () => {
    const mockCfg = { minAdvanceHours: 2 };
    const spy = jest.spyOn(service, 'getConfig');
    spy.mockResolvedValue(mockCfg);
    const result = await controller.getConfig();
    expect(result).toEqual(mockCfg);
    expect(spy).toHaveBeenCalled();
  });

  it('debería actualizar la configuración', async () => {
    const mockCfg = { minAdvanceHours: 4 };
    const spy = jest.spyOn(service, 'updateConfig');
    spy.mockResolvedValue(mockCfg);
    const result = await controller.updateConfig(mockCfg as any);
    expect(result).toEqual(mockCfg);
    expect(spy).toHaveBeenCalledWith(mockCfg);
  });
});
