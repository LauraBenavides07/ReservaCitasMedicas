import { Test, TestingModule } from '@nestjs/testing';
import { DoctorController } from './doctor.controller';
import { DoctorService } from '../../application/services/doctor.service';
import { DoctorExceptionService } from '../../application/services/doctor-exception.service';

describe('DoctorController', () => {
  let controller: DoctorController;
  let doctorService: DoctorService;
  let exceptionService: DoctorExceptionService;

  const mockDoctorService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockExceptionService = {
    add: jest.fn(),
    findByDoctor: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DoctorController],
      providers: [
        { provide: DoctorService, useValue: mockDoctorService },
        { provide: DoctorExceptionService, useValue: mockExceptionService },
      ],
    }).compile();

    controller = module.get<DoctorController>(DoctorController);
    doctorService = module.get<DoctorService>(DoctorService);
    exceptionService = module.get<DoctorExceptionService>(
      DoctorExceptionService,
    );
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('CRUD Básico', () => {
    it('getDoctors debería llamar a findAll', async () => {
      mockDoctorService.findAll.mockResolvedValue([]);
      await controller.getDoctors();
      expect(doctorService.findAll).toHaveBeenCalled();
    });

    it('getDoctor debería llamar a findOne', async () => {
      mockDoctorService.findOne.mockResolvedValue({ id: '1' });
      await controller.getDoctor('uuid-123');
      expect(doctorService.findOne).toHaveBeenCalledWith('uuid-123');
    });

    it('createDoctor debería llamar a create', async () => {
      const data = { name: 'Dr. X' };
      await controller.createDoctor(data);
      expect(doctorService.create).toHaveBeenCalledWith(data);
    });

    it('updateDoctor debería llamar a update', async () => {
      const data = { name: 'Dr. Y' };
      await controller.updateDoctor('uuid-123', data);
      expect(doctorService.update).toHaveBeenCalledWith('uuid-123', data);
    });

    it('deleteDoctor debería llamar a remove', async () => {
      await controller.deleteDoctor('uuid-123');
      expect(doctorService.remove).toHaveBeenCalledWith('uuid-123');
    });
  });

  describe('Excepciones', () => {
    it('addException debería llamar a exceptionService.add', async () => {
      const data = { date: '2026-05-10' };
      await controller.addException('d1', data);
      expect(exceptionService.add).toHaveBeenCalledWith({
        ...data,
        doctor: { id: 'd1' },
      });
    });

    it('getExceptions debería llamar a exceptionService.findByDoctor', async () => {
      await controller.getExceptions('d1');
      expect(exceptionService.findByDoctor).toHaveBeenCalledWith('d1');
    });

    it('removeException debería llamar a exceptionService.remove', async () => {
      await controller.removeException('d1', 'e1');
      expect(exceptionService.remove).toHaveBeenCalledWith('e1');
    });
  });
});
