import { Test, TestingModule } from '@nestjs/testing';
import { PatientController } from './patient.controller';
import { PatientService } from '../../application/services/patient.service';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';

describe('PatientController', () => {
  let controller: PatientController;
  let patientService: PatientService;

  const mockPatientService = {
    updateMedicalInfo: jest.fn(),
  };

  const mockJwtAuthGuard = { canActivate: jest.fn(() => true) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientController],
      providers: [{ provide: PatientService, useValue: mockPatientService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<PatientController>(PatientController);
    patientService = module.get<PatientService>(PatientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('updateMedicalInfo', () => {
    it('debería llamar al servicio con los parámetros correctos', async () => {
      const dto = {
        diagnosis: 'Hipertensión',
        observations: 'Control mensual',
      };
      const spy = jest.spyOn(patientService, 'updateMedicalInfo');
      spy.mockResolvedValue({
        id: 'p1',
        ...dto,
      });

      const result = await controller.updateMedicalInfo('p1', dto);

      expect(spy).toHaveBeenCalledWith('p1', dto);
      expect(result.id).toBe('p1');
      expect(result.diagnosis).toBe('Hipertensión');
    });

    it('debería funcionar con body vacío', async () => {
      const spy = jest.spyOn(patientService, 'updateMedicalInfo');
      spy.mockResolvedValue({
        id: 'p1',
      });

      const result = await controller.updateMedicalInfo('p1', {});

      expect(spy).toHaveBeenCalledWith('p1', {});
      expect(result.id).toBe('p1');
    });
  });
});
