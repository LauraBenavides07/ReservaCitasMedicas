import { Test, TestingModule } from '@nestjs/testing';
import { DoctorExceptionService } from './doctor-exception.service';
import { IDoctorExceptionRepository } from '../ports/doctor-exception.repository';
import { IDoctorRepository } from '../ports/doctor.repository';

describe('DoctorExceptionService', () => {
  let service: DoctorExceptionService;

  const mockExceptionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    findOneBy: jest.fn(),
  };

  const mockDoctorRepository = {
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorExceptionService,
        {
          provide: IDoctorExceptionRepository,
          useValue: mockExceptionRepository,
        },
        { provide: IDoctorRepository, useValue: mockDoctorRepository },
      ],
    }).compile();

    service = module.get<DoctorExceptionService>(DoctorExceptionService);
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debería agregar una excepción', async () => {
    const data = { doctor: { id: '1' }, date: '2026-05-20', reason: 'Vacaciones' };
    mockDoctorRepository.findOneBy.mockResolvedValue({ id: '1' });
    mockExceptionRepository.create.mockReturnValue(data);
    mockExceptionRepository.save.mockResolvedValue(data);

    const result = await service.add(data);
    expect(result.reason).toBe('Vacaciones');
  });

  it('debería obtener excepciones de un médico', async () => {
    mockExceptionRepository.find.mockResolvedValue([
      { id: 'e1' },
    ]);
    const result = await service.findByDoctor('1');
    expect(result).toHaveLength(1);
    expect(mockExceptionRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { doctor: { id: '1' } },
      }),
    );
  });

  it('debería eliminar una excepción', async () => {
    mockExceptionRepository.findOneBy.mockResolvedValue({ id: 'e1' });
    mockExceptionRepository.delete.mockResolvedValue({ affected: 1 });
    await service.remove('e1');
    expect(mockExceptionRepository.delete).toHaveBeenCalledWith('e1');
  });
});
