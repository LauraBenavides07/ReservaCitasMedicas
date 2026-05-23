import { Test, TestingModule } from '@nestjs/testing';
import { PatientService } from './patient.service';
import { Patient } from '../../domain/entities/patient.entity';
import { NotFoundException } from '@nestjs/common';
import { IPatientRepository } from '../ports/patient.repository';

describe('PatientService', () => {
  let service: PatientService;

  const mockPatientRepository = {
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientService,
        { provide: IPatientRepository, useValue: mockPatientRepository },
      ],
    }).compile();

    service = module.get<PatientService>(PatientService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findByDocument', () => {
    it('debería retornar un paciente si existe', async () => {
      mockPatientRepository.findOneBy.mockResolvedValue({
        id: '1',
        document: '123',
        firstName: 'Juan',
      });
      const result = await service.findByDocument('123');
      expect(result.document).toBe('123');
    });

    it('debería lanzar NotFoundException si no existe', async () => {
      mockPatientRepository.findOneBy.mockResolvedValue(null);
      await expect(service.findByDocument('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('debería retornar un paciente por id', async () => {
      mockPatientRepository.findOneBy.mockResolvedValue({
        id: '1',
        document: '123',
      });
      const result = await service.findOne('1');
      expect(result.id).toBe('1');
    });

    it('debería lanzar NotFoundException si no existe', async () => {
      mockPatientRepository.findOneBy.mockResolvedValue(null);
      await expect(service.findOne('99')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByDocumentOrCreate', () => {
    const data = {
      document: '123',
      firstName: 'Juan',
      lastName: 'Pérez',
      phone: '555-1234',
      gender: 'M',
    };

    it('debería retornar paciente existente', async () => {
      mockPatientRepository.findOneBy.mockResolvedValue({
        id: '1',
        ...data,
      });
      const result = await service.findByDocumentOrCreate(data);
      expect(result.document).toBe('123');
      expect(mockPatientRepository.create).not.toHaveBeenCalled();
    });

    it('debería crear un nuevo paciente si no existe', async () => {
      mockPatientRepository.findOneBy.mockResolvedValue(null);
      mockPatientRepository.create.mockReturnValue(data);
      mockPatientRepository.save.mockResolvedValue({ id: '2', ...data });

      const result = await service.findByDocumentOrCreate(data);
      expect(result.document).toBe('123');
      expect(mockPatientRepository.create).toHaveBeenCalledWith(data);
    });
  });

  describe('updateMedicalInfo', () => {
    it('debería actualizar diagnosis y observations', async () => {
      const patient = new Patient();
      patient.id = '1';
      patient.diagnosis = 'Diagnóstico anterior';

      mockPatientRepository.findOneBy.mockResolvedValue(patient);
      mockPatientRepository.save.mockResolvedValue({
        ...patient,
        diagnosis: 'Nuevo diagnóstico',
        observations: 'Observaciones nuevas',
      });

      const result = await service.updateMedicalInfo('1', {
        diagnosis: 'Nuevo diagnóstico',
        observations: 'Observaciones nuevas',
      });

      expect(result.diagnosis).toBe('Nuevo diagnóstico');
      expect(result.observations).toBe('Observaciones nuevas');
      expect(mockPatientRepository.save).toHaveBeenCalled();
    });

    it('debería actualizar solo diagnosis si observations no se envía', async () => {
      const patient = new Patient();
      patient.id = '1';
      patient.diagnosis = 'Anterior';
      patient.observations = 'Obs previa';

      mockPatientRepository.findOneBy.mockResolvedValue(patient);
      mockPatientRepository.save.mockResolvedValue({
        ...patient,
        diagnosis: 'Nuevo dx',
      });

      const result = await service.updateMedicalInfo('1', {
        diagnosis: 'Nuevo dx',
      });

      expect(result.diagnosis).toBe('Nuevo dx');
      expect(result.observations).toBe('Obs previa');
    });

    it('debería lanzar NotFoundException si el paciente no existe', async () => {
      mockPatientRepository.findOneBy.mockResolvedValue(null);
      await expect(
        service.updateMedicalInfo('99', { diagnosis: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
