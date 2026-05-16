import { Test, TestingModule } from '@nestjs/testing';
import { DoctorController } from './doctor.controller';
import { DoctorService } from '../../application/services/doctor.service';

describe('DoctorController', () => {
  let controller: DoctorController;
  let service: DoctorService;

  const mockDoctorService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addException: jest.fn(),
    getExceptions: jest.fn(),
    removeException: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DoctorController],
      providers: [
        {
          provide: DoctorService,
          useValue: mockDoctorService,
        },
      ],
    }).compile();

    controller = module.get<DoctorController>(DoctorController);
    service = module.get<DoctorService>(DoctorService);
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('CRUD Básico', () => {
    it('getDoctors debería llamar a findAll', async () => {
      mockDoctorService.findAll.mockResolvedValue([]);
      await controller.getDoctors();
      expect(service.findAll).toHaveBeenCalled();
    });

    it('getDoctor debería llamar a findOne', async () => {
      mockDoctorService.findOne.mockResolvedValue({ id: '1' });
      await controller.getDoctor('uuid-123');
      expect(service.findOne).toHaveBeenCalledWith('uuid-123');
    });

    it('createDoctor debería llamar a create', async () => {
      const data = { name: 'Dr. X' };
      await controller.createDoctor(data);
      expect(service.create).toHaveBeenCalledWith(data);
    });

    it('updateDoctor debería llamar a update', async () => {
      const data = { name: 'Dr. Y' };
      await controller.updateDoctor('uuid-123', data);
      expect(service.update).toHaveBeenCalledWith('uuid-123', data);
    });

    it('deleteDoctor debería llamar a remove', async () => {
      await controller.deleteDoctor('uuid-123');
      expect(service.remove).toHaveBeenCalledWith('uuid-123');
    });
  });

  describe('Excepciones', () => {
    it('addException debería llamar a service.addException', async () => {
      const data = { date: '2026-05-10' };
      await controller.addException('d1', data);
      expect(service.addException).toHaveBeenCalledWith({ ...data, doctorId: 'd1' });
    });

    it('getExceptions debería llamar a service.getExceptions', async () => {
      await controller.getExceptions('d1');
      expect(service.getExceptions).toHaveBeenCalledWith('d1');
    });

    it('removeException debería llamar a service.removeException', async () => {
      await controller.removeException('d1', 'e1');
      expect(service.removeException).toHaveBeenCalledWith('e1');
    });
  });
});
