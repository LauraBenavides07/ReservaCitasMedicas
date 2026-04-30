import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentService } from './appointment.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Appointment } from '../../domain/entities/appointment.entity';
import { Patient } from '../../domain/entities/patient.entity';
import { Doctor } from '../../domain/entities/doctor.entity';
import { DoctorException } from '../../domain/entities/doctor-exception.entity';
import { ConfigService } from './config.service';
import { CreateAppointmentDto } from '../../presentation/dto/create-appointment.dto';

describe('AppointmentService', () => {
  let service: AppointmentService;

  const mockAppointmentRepository = {
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    find: jest.fn(),
  };

  const mockPatientRepository = {
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockDoctorRepository = {
    findOneBy: jest.fn(),
    find: jest.fn(),
  };

  const mockDoctorExceptionRepository = {
    findOneBy: jest.fn(),
  };

  const mockConfigService = {
    getConfig: jest
      .fn()
      .mockResolvedValue({ minAdvanceHours: 2, appointmentWindowWeeks: 4 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        {
          provide: getRepositoryToken(Appointment),
          useValue: mockAppointmentRepository,
        },
        {
          provide: getRepositoryToken(Patient),
          useValue: mockPatientRepository,
        },
        { provide: getRepositoryToken(Doctor), useValue: mockDoctorRepository },
        {
          provide: getRepositoryToken(DoctorException),
          useValue: mockDoctorExceptionRepository,
        },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AppointmentService>(AppointmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // 1. Crear cita correctamente
  it('debería crear una cita correctamente', async () => {
    // Fecha futura (mínimo 3 horas adelante)
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 3);
    const futureDateStr = futureDate.toISOString();

    mockDoctorRepository.findOneBy.mockResolvedValue({
      id: '2',
      name: 'Test Doc',
    });
    mockPatientRepository.findOneBy.mockResolvedValue({
      id: '1',
      document: '123',
    });
    mockAppointmentRepository.findOneBy.mockResolvedValue(null);
    mockAppointmentRepository.create.mockReturnValue({
      id: '1',
      patient: { id: '1' },
      doctor: { id: '2' },
      appointmentDate: futureDateStr,
    });
    mockAppointmentRepository.save.mockResolvedValue({
      id: '1',
      patient: { id: '1' },
      doctor: { id: '2' },
      appointmentDate: futureDateStr,
    });

    const dto = {
      patientId: '1',
      doctorId: '2',
      date: futureDateStr,
      time: '10:00',
      patientDocument: '123',
    };

    const result = await service.create(dto as unknown as CreateAppointmentDto);

    expect(result).toBeDefined();
    expect(result.patient.id).toBe('1');
  });

  // 2. Error al crear cita sin doctor
  it('debería fallar si falta doctorId', async () => {
    mockDoctorRepository.findOneBy.mockResolvedValue(null);

    // Fecha futura
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 3);

    const dto: any = {
      patientId: '1',
      date: futureDate.toISOString(),
      // missing doctorId
    };

    await expect(
      service.create(dto as unknown as CreateAppointmentDto),
    ).rejects.toThrow();
  });

  // 3. Obtener lista de citas
  it('debería retornar una lista de citas', async () => {
    mockAppointmentRepository.find.mockResolvedValue([
      { id: '1', patient: { id: '1' } },
      { id: '2', patient: { id: '2' } },
    ]);

    const result = await service.findAll();

    expect(result.length).toBe(2);
  });

  // 4. Lista vacía de citas
  it('debería retornar lista vacía si no hay citas', async () => {
    mockAppointmentRepository.find.mockResolvedValue([]);

    const result = await service.findAll();

    expect(result).toEqual([]);
  });

  // 5. Buscar cita por ID (existe)
  it('debería encontrar una cita por id', async () => {
    mockAppointmentRepository.findOneBy.mockResolvedValue({
      id: '1',
      patient: { id: '1' },
    });

    const result = await service.findById('1');

    expect(result).toBeDefined();
    expect(result!.id).toBe('1');
  });

  // 6. Buscar paciente por documento (existe)
  it('debería encontrar un paciente por documento', async () => {
    mockPatientRepository.findOneBy.mockResolvedValue({
      id: 'p1',
      document: '12345678',
      firstName: 'Juan',
      lastName: 'Perez',
    });

    const result = await service.findPatientByDocument('12345678');

    expect(result).toBeDefined();
    expect(result.document).toBe('12345678');
    expect(result.firstName).toBe('Juan');
  });

  // 7. Buscar paciente por documento (no existe)
  it('debería lanzar NotFoundException si el paciente no existe', async () => {
    mockPatientRepository.findOneBy.mockResolvedValue(null);

    await expect(service.findPatientByDocument('00000000')).rejects.toThrow();
  });
});
