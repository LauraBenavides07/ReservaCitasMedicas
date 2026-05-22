import { Test, TestingModule } from '@nestjs/testing';
import { DoctorService } from './doctor.service';
import { Doctor } from '../../domain/entities/doctor.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { IDoctorRepository } from '../ports/doctor.repository';
import { IAppointmentRepository } from '../ports/appointment.repository';

describe('DoctorService', () => {
  let service: DoctorService;

  const mockDoctorRepository = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockAppointmentRepository = {
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorService,
        { provide: IDoctorRepository, useValue: mockDoctorRepository },
        {
          provide: IAppointmentRepository,
          useValue: mockAppointmentRepository,
        },
      ],
    }).compile();

    service = module.get<DoctorService>(DoctorService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('debería retornar una lista de médicos', async () => {
      mockDoctorRepository.find.mockResolvedValue([
        { id: '1', name: 'Dr. Test' },
      ]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('debería retornar un médico si existe', async () => {
      mockDoctorRepository.findOneBy.mockResolvedValue({
        id: '1',
        name: 'Dr. Test',
      });
      const result = await service.findOne('1');
      expect(result.id).toBe('1');
    });

    it('debería lanzar NotFoundException si no existe', async () => {
      mockDoctorRepository.findOneBy.mockResolvedValue(null);
      await expect(service.findOne('99')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('debería crear un nuevo médico', async () => {
      const data = { name: 'Dr. New', specialty: 'General' };
      mockDoctorRepository.create.mockReturnValue(data);
      mockDoctorRepository.save.mockResolvedValue({ id: '2', ...data });

      const result = await service.create(data);
      expect(result.id).toBe('2');
      expect(mockDoctorRepository.create).toHaveBeenCalledWith(data);
    });
  });

  describe('update', () => {
    it('debería actualizar los datos de un médico', async () => {
      mockDoctorRepository.findOneBy.mockResolvedValueOnce({
        id: '1',
        name: 'Dr. Old',
      });
      mockDoctorRepository.update.mockResolvedValue({});
      mockDoctorRepository.findOneBy.mockResolvedValueOnce({
        id: '1',
        name: 'Dr. New',
      });

      const result = await service.update('1', { name: 'Dr. New' });
      expect(result.name).toBe('Dr. New');
    });
  });

  describe('remove', () => {
    it('debería eliminar un médico si no tiene citas agendadas', async () => {
      mockDoctorRepository.findOneBy.mockResolvedValue({ id: '1' });
      mockAppointmentRepository.count.mockResolvedValue(0);
      mockDoctorRepository.remove.mockResolvedValue({ id: '1' });

      const result = await service.remove('1');
      expect(result).toBeDefined();
    });

    it('debería lanzar BadRequestException si tiene citas agendadas', async () => {
      mockDoctorRepository.findOneBy.mockResolvedValue({ id: '1' });
      mockAppointmentRepository.count.mockResolvedValue(5);

      await expect(service.remove('1')).rejects.toThrow(BadRequestException);
    });
  });
});
