import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentService } from './appointment.service';
import { Appointment } from '../../domain/entities/appointment.entity';
import { Patient } from '../../domain/entities/patient.entity';
import { Doctor } from '../../domain/entities/doctor.entity';
import { ConfigService } from './config.service';
import { AvailabilityService } from './availability.service';
import { PatientService } from './patient.service';
import { NotificationService } from './notification.service';
import { CreateAppointmentDto } from '../../presentation/dto/create-appointment.dto';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { IAppointmentRepository } from '../ports/appointment.repository';
import { IDoctorRepository } from '../ports/doctor.repository';
import { IAppointmentHistoryRepository } from '../ports/appointment-history.repository';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let mockAvailability: Record<string, jest.Mock>;
  let mockPatientSvc: Record<string, jest.Mock>;
  let mockNotificationSvc: Record<string, jest.Mock>;

  const mockAppointmentRepository = {
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockDoctorRepository = {
    findOneBy: jest.fn(),
    find: jest.fn(),
  };

  const mockConfigService = {
    getConfig: jest
      .fn()
      .mockResolvedValue({ minAdvanceHours: 2, appointmentWindowDays: 15 }),
  };

  beforeEach(async () => {
    mockAvailability = {
      validateTimeWindow: jest.fn().mockResolvedValue(undefined),
      validateDoctorException: jest.fn().mockResolvedValue(undefined),
      assertSlotAvailable: jest.fn().mockResolvedValue(undefined),
    };
    mockPatientSvc = {
      findByDocumentOrCreate: jest.fn(),
      findByDocument: jest.fn(),
    };
    mockNotificationSvc = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        {
          provide: IAppointmentRepository,
          useValue: mockAppointmentRepository,
        },
        { provide: IDoctorRepository, useValue: mockDoctorRepository },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AvailabilityService, useValue: mockAvailability },
        { provide: PatientService, useValue: mockPatientSvc },
        { provide: NotificationService, useValue: mockNotificationSvc },
        {
          provide: IAppointmentHistoryRepository,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AppointmentService>(AppointmentService);
    jest.clearAllMocks();
    mockConfigService.getConfig.mockResolvedValue({
      minAdvanceHours: 2,
      appointmentWindowDays: 15,
    });
  });

  describe('findAllByDoctorAndDate', () => {
    it('debería listar citas sin fecha', async () => {
      mockAppointmentRepository.findAndCount.mockResolvedValue([[], 0]);
      const result = await service.findAllByDoctorAndDate('d1');
      expect(result.total).toBe(0);
      expect(mockAppointmentRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { doctor: { id: 'd1' } },
        }),
      );
    });

    it('debería listar citas con fecha', async () => {
      mockAppointmentRepository.findAndCount.mockResolvedValue([[], 0]);
      await service.findAllByDoctorAndDate('d1', '2026-10-10');
      expect(mockAppointmentRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { doctor: { id: 'd1' }, appointmentDate: '2026-10-10' },
        }),
      );
    });
  });

  describe('create', () => {
    it('debería crear una cita válida', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      mockDoctorRepository.findOneBy.mockResolvedValue({
        id: 'd1',
        name: 'Dr. S',
      });
      mockPatientSvc.findByDocumentOrCreate.mockResolvedValue({
        id: 'p1',
        firstName: 'J',
        lastName: 'P',
        phone: '123',
      });
      mockAppointmentRepository.create.mockReturnValue({ id: 'a1' });
      mockAppointmentRepository.save.mockResolvedValue({
        id: 'a1',
        appointmentDate: tomorrowStr,
        appointmentTime: '10:00',
      });

      const dto: CreateAppointmentDto = {
        patientDocument: '123',
        firstName: 'J',
        lastName: 'P',
        phone: '123',
        gender: 'M',
        doctorId: 'd1',
        date: tomorrowStr,
        time: '10:00',
      };

      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(mockNotificationSvc.emit).toHaveBeenCalledWith(
        'appointment.created',
        expect.any(Object),
      );
    });

    it('debería crear el paciente si no existe', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      mockDoctorRepository.findOneBy.mockResolvedValue({
        id: 'd1',
        name: 'Dr. S',
      });
      mockPatientSvc.findByDocumentOrCreate.mockResolvedValue({
        id: 'p1',
        firstName: 'New',
        lastName: 'P',
        phone: '123',
      });
      mockAppointmentRepository.create.mockReturnValue({ id: 'a1' });
      mockAppointmentRepository.save.mockResolvedValue({ id: 'a1' });

      await service.create({
        patientDocument: '999',
        firstName: 'New',
        lastName: 'P',
        phone: '123',
        gender: 'M',
        doctorId: 'd1',
        date: tomorrowStr,
        time: '10:00',
      });

      expect(mockPatientSvc.findByDocumentOrCreate).toHaveBeenCalled();
    });

    it('debería fallar si el doctor no existe', async () => {
      mockDoctorRepository.findOneBy.mockResolvedValue(null);
      await expect(
        service.create({ doctorId: 'invalid' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelAppointment', () => {
    it('debería cancelar una cita con éxito', async () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);
      const dateStr = future.toISOString().split('T')[0];

      const app = {
        id: 'a1',
        status: 'agendada',
        appointmentDate: dateStr,
        appointmentTime: '10:00',
        patient: { id: 'p1', firstName: 'J', lastName: 'P', phone: '1' },
        doctor: { name: 'D' },
        isOwnedBy: jest.fn().mockReturnValue(true),
        canBeCancelled: jest.fn().mockReturnValue(true),
        cancel: jest.fn(),
      };
      mockAppointmentRepository.findOne.mockResolvedValue(app);
      mockAppointmentRepository.save.mockResolvedValue({
        ...app,
        status: 'cancelada',
      });

      const result = await service.cancelAppointment('a1', 'p1');
      expect(result.status).toBe('cancelada');
      expect(mockNotificationSvc.emit).toHaveBeenCalledWith(
        'appointment.cancelled',
        expect.any(Object),
      );
    });

    it('debería fallar si la cita no existe', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue(null);
      await expect(service.cancelAppointment('a1', 'p1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debería fallar si el paciente no tiene permiso', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue({
        id: 'a1',
        patient: { id: 'p1', keycloakId: 'k1' },
        isOwnedBy: jest.fn().mockReturnValue(false),
      });
      await expect(service.cancelAppointment('a1', 'other')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debería fallar si la cita es pasada', async () => {
      const past = new Date();
      past.setDate(past.getDate() - 1);
      const dateStr = past.toISOString().split('T')[0];

      mockAppointmentRepository.findOne.mockResolvedValue({
        id: 'a1',
        appointmentDate: dateStr,
        appointmentTime: '10:00',
        patient: { id: 'p1' },
        isOwnedBy: jest.fn().mockReturnValue(true),
        canBeCancelled: jest.fn().mockReturnValue(false),
      });
      await expect(service.cancelAppointment('a1', 'p1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('reschedule', () => {
    it('debería permitir reagendar si hay disponibilidad', async () => {
      const app = {
        id: 'a1',
        patient: { id: 'p1' },
        doctor: { id: 'd1', name: 'D' },
        isOwnedBy: jest.fn().mockReturnValue(true),
        reschedule: jest.fn(),
      };
      mockAppointmentRepository.findOne.mockResolvedValue(app);
      mockAppointmentRepository.save.mockResolvedValue({
        id: 'a1',
        appointmentTime: '11:00',
      });

      const future = new Date();
      future.setDate(future.getDate() + 5);
      const result = await service.reschedule(
        'a1',
        'p1',
        future.toISOString().split('T')[0],
        '11:00',
        'staff',
      );
      expect(result.appointmentTime).toBe('11:00');
    });

    it('debería fallar si la cita no existe', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue(null);
      await expect(
        service.reschedule('a1', 'p1', '2026-10-10', '10:00'),
      ).rejects.toThrow(NotFoundException);
    });

    it('debería fallar si el paciente no tiene permiso', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue({
        id: 'a1',
        patient: { id: 'p1' },
        isOwnedBy: jest.fn().mockReturnValue(false),
      });
      await expect(
        service.reschedule('a1', 'p2', '2026-10-10', '10:00'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Consultas', () => {
    it('findAllByPatient debería retornar citas del paciente', async () => {
      mockAppointmentRepository.find.mockResolvedValue([{ id: 'a1' }]);
      const result = await service.findAllByPatient('p1', 'doc1');
      expect(result).toHaveLength(1);
    });

    it('findAll debería retornar todas las citas', async () => {
      mockAppointmentRepository.find.mockResolvedValue([]);
      await service.findAll();
      expect(mockAppointmentRepository.find).toHaveBeenCalled();
    });

    it('findById debería retornar una cita', async () => {
      mockAppointmentRepository.findOneBy.mockResolvedValue({ id: 'a1' });
      const result = await service.findById('a1');
      expect(result?.id).toBe('a1');
    });

    it('findPatientByDocument debería retornar un paciente', async () => {
      mockPatientSvc.findByDocument.mockResolvedValue({ document: '123' });
      const result = await service.findPatientByDocument('123');
      expect(result.document).toBe('123');
    });

    it('findPatientByDocument debería fallar si no existe', async () => {
      mockPatientSvc.findByDocument.mockRejectedValue(new NotFoundException());
      await expect(service.findPatientByDocument('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Confirmación', () => {
    it('confirmAppointment debería cambiar estado a confirmada', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue({
        id: '1',
        status: 'agendada',
        isCancelled: jest.fn().mockReturnValue(false),
        confirm: jest.fn(),
      });
      mockAppointmentRepository.save.mockImplementation((a) =>
        Promise.resolve({ ...a, status: 'confirmada' }),
      );
      const result = await service.confirmAppointment('1');
      expect(result.status).toBe('confirmada');
    });

    it('confirmAppointment debería fallar si no existe', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue(null);
      await expect(service.confirmAppointment('1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('confirmAppointment debería fallar si está cancelada', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue({
        id: '1',
        status: 'cancelada',
        isCancelled: jest.fn().mockReturnValue(true),
      });
      await expect(service.confirmAppointment('1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
