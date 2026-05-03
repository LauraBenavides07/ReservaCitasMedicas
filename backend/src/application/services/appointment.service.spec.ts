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
    findOne: jest.fn(),
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
  it('debería crear una cita válida', async () => {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 4);

    mockDoctorRepository.findOneBy.mockResolvedValue({ id: '1' });
    mockPatientRepository.findOneBy.mockResolvedValue({ id: '1' });
    mockAppointmentRepository.findOneBy.mockResolvedValue(null);
    mockAppointmentRepository.save.mockResolvedValue({ id: '10' });

    const dto = {
      patientId: '1',
      doctorId: '1',
      date: futureDate.toISOString().split('T')[0],
      time: '10:00',
      patientDocument: '123',
    };

    const result = await service.create(dto as unknown as CreateAppointmentDto);

    expect(result).toBeDefined();
  });

  // 2. Error si el médico no existe
  it('debería fallar si el médico no existe', async () => {
    mockDoctorRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.create({
        doctorId: '99',
        patientId: '1',
      } as unknown as CreateAppointmentDto),
    ).rejects.toThrow();
  });

  // 3. Rechazar cita con poca anticipación
  it('debería rechazar citas con anticipación insuficiente', async () => {
    const nearDate = new Date();
    nearDate.setMinutes(nearDate.getMinutes() + 20);

    mockDoctorRepository.findOneBy.mockResolvedValue({ id: '1' });

    await expect(
      service.create({
        doctorId: '1',
        patientId: '1',
        date: nearDate.toISOString().split('T')[0],
        time: nearDate.toTimeString().substring(0, 5),
      } as unknown as CreateAppointmentDto),
    ).rejects.toThrow();
  });

  // 4. Rechazar cita fuera del horizonte máximo
  it('debería rechazar citas demasiado lejanas', async () => {
    const farDate = new Date();
    farDate.setDate(farDate.getDate() + 500);

    mockDoctorRepository.findOneBy.mockResolvedValue({ id: '1' });

    await expect(
      service.create({
        doctorId: '1',
        patientId: '1',
        date: farDate.toISOString().split('T')[0],
        time: '10:00',
      } as unknown as CreateAppointmentDto),
    ).rejects.toThrow();
  });

  // 5. Evitar citas duplicadas
  it('debería impedir conflicto de horario', async () => {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 5);

    mockDoctorRepository.findOneBy.mockResolvedValue({ id: '1' });
    mockAppointmentRepository.findOneBy.mockResolvedValue({ id: 'existing' });

    await expect(
      service.create({
        doctorId: '1',
        patientId: '1',
        date: futureDate.toISOString().split('T')[0],
        time: '10:00',
      } as unknown as CreateAppointmentDto),
    ).rejects.toThrow();
  });

  // 6. Obtener horarios disponibles
  it('debería retornar horarios disponibles', async () => {
    mockDoctorRepository.findOneBy.mockResolvedValue({
      id: '1',
      scheduleStart: '08:00',
      scheduleEnd: '17:00',
    });

    mockAppointmentRepository.find.mockResolvedValue([]);

    const result = await service.getAvailableSlots('1', '2026-05-10');

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  // 7. Cancelar cita
  it('debería cancelar una cita existente', async () => {
    mockAppointmentRepository.findOne.mockResolvedValue({
      id: '1',
      status: 'ACTIVE',
      patient: { id: 'patient1' },
    });

    mockAppointmentRepository.save.mockResolvedValue({
      id: '1',
      status: 'cancelada',
    });

    const result = await service.cancelAppointment('1', 'patient1');

    expect(result.status).toBe('cancelada');
  });

  // 8. Reprogramar cita
  it('debería reprogramar una cita exitosamente', async () => {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 24);

    mockAppointmentRepository.findOne.mockResolvedValue({
      id: '1',
      doctor: { id: '1' },
      patient: { id: 'patient1' },
    });

    mockAppointmentRepository.findOneBy.mockResolvedValue(null);

    mockAppointmentRepository.save.mockResolvedValue({
      id: '1',
      appointmentTime: '15:00',
    });

    const result = await service.reschedule(
      '1',
      'patient1',
      futureDate.toISOString().split('T')[0],
      '15:00',
    );

    expect(result.appointmentTime).toBe('15:00');
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
