import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from '../../application/services/appointment.service';

describe('AppointmentController', () => {
  let controller: AppointmentController;
  let service: AppointmentService;

  const mockAppointmentService = {
    findPatientByDocument: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentController],
      providers: [
        { provide: AppointmentService, useValue: mockAppointmentService },
      ],
    }).compile();

    controller = module.get<AppointmentController>(AppointmentController);
    service = module.get<AppointmentService>(AppointmentService);
  });

  it('should return a patient by document', async () => {
    const mockPatient = { id: 'uuid', document: '123' };
    mockAppointmentService.findPatientByDocument.mockResolvedValue(mockPatient);

    const result = await controller.getPatientByDocument('123');
    expect(result).toEqual(mockPatient);
    expect(service.findPatientByDocument).toHaveBeenCalledWith('123');
  });
});
