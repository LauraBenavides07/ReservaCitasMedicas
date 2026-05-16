import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentService } from './appointment.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Appointment } from '../../domain/entities/appointment.entity';
import { Patient } from '../../domain/entities/patient.entity';
import { Doctor } from '../../domain/entities/doctor.entity';
import { DoctorException } from '../../domain/entities/doctor-exception.entity';
import { ConfigService } from './config.service';
import { CreateAppointmentDto } from '../../presentation/dto/create-appointment.dto';
import { NOTIFICATION_SERVICE } from '../../infrastructure/messaging/notifications-client.module';
import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';

describe('AppointmentService', () => {
  let service: AppointmentService;

  const mockAppointmentRepository = {
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({}),
    }),
  };

  const mockPatientRepository = {
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockDoctorRepository = {
    findOneBy: jest.fn(),
    find: jest.fn(),
  };

  const mockDoctorExceptionRepository = {
    findOneBy: jest.fn(),
  };

  const mockConfigService = {
    getConfig: jest.fn().mockResolvedValue({ minAdvanceHours: 2, appointmentWindowDays: 15 }),
  };

  const mockNotificationClient = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        { provide: getRepositoryToken(Appointment), useValue: mockAppointmentRepository },
        { provide: getRepositoryToken(Patient), useValue: mockPatientRepository },
        { provide: getRepositoryToken(Doctor), useValue: mockDoctorRepository },
        { provide: getRepositoryToken(DoctorException), useValue: mockDoctorExceptionRepository },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: NOTIFICATION_SERVICE, useValue: mockNotificationClient },
      ],
    }).compile();

    service = module.get<AppointmentService>(AppointmentService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debería crear una cita válida', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      mockDoctorRepository.findOneBy.mockResolvedValue({ id: 'd1', name: 'Dr. S' });
      mockPatientRepository.findOneBy.mockResolvedValue({ id: 'p1', firstName: 'J', lastName: 'P', phone: '123' });
      mockAppointmentRepository.findOneBy.mockResolvedValue(null);
      mockAppointmentRepository.create.mockReturnValue({ id: 'a1' });
      mockAppointmentRepository.save.mockResolvedValue({ id: 'a1', appointmentDate: tomorrowStr, appointmentTime: '10:00' });
      mockAppointmentRepository.findOne.mockResolvedValue({ 
        id: 'a1', appointmentDate: tomorrowStr, appointmentTime: '10:00',
        patient: { firstName: 'J', lastName: 'P', phone: '123' },
        doctor: { name: 'Dr. S' }
      });

      const dto: CreateAppointmentDto = {
        patientDocument: '123', firstName: 'J', lastName: 'P', phone: '123', gender: 'M',
        doctorId: 'd1', date: tomorrowStr, time: '10:00'
      };

      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(mockNotificationClient.emit).toHaveBeenCalledWith('appointment.created', expect.any(Object));
    });

    it('debería fallar si el horario está ocupado', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      mockDoctorRepository.findOneBy.mockResolvedValue({ id: 'd1' });
      mockAppointmentRepository.findOneBy.mockResolvedValue({ id: 'existing' });
      await expect(service.create({ doctorId: 'd1', date: tomorrowStr, time: '10:00' } as any))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('getAvailableSlots', () => {
    it('debería filtrar horas de almuerzo', async () => {
      mockDoctorRepository.findOneBy.mockResolvedValue({ 
        id: 'd1', scheduleStart: '08:00', scheduleEnd: '12:00', lunchStart: '10:00', lunchEnd: '11:00',
        slotDuration: 30, activeDays: '1,2,3,4,5,6,7'
      });
      mockAppointmentRepository.find.mockResolvedValue([]);
      mockDoctorExceptionRepository.findOneBy.mockResolvedValue(null);

      const future = new Date();
      future.setDate(future.getDate() + 3);
      const result = await service.getAvailableSlots('d1', future.toISOString().split('T')[0]);
      expect(result).toContain('08:00');
      expect(result).not.toContain('10:00');
    });

    it('debería retornar vacío si hay excepción médica', async () => {
      mockDoctorRepository.findOneBy.mockResolvedValue({ id: 'd1' });
      mockDoctorExceptionRepository.findOneBy.mockResolvedValue({ reason: 'Día Libre' });
      const result = await service.getAvailableSlots('d1', '2026-05-20');
      expect(result).toEqual([]);
    });
  });

  describe('reschedule', () => {
    it('debería permitir reagendar si hay disponibilidad', async () => {
      const app = { id: 'a1', patient: { id: 'p1' }, doctor: { id: 'd1', name: 'D' } };
      mockAppointmentRepository.findOne.mockResolvedValue(app);
      mockAppointmentRepository.findOneBy.mockResolvedValue(null); 
      mockDoctorExceptionRepository.findOneBy.mockResolvedValue(null);
      mockAppointmentRepository.save.mockResolvedValue({ id: 'a1', appointmentTime: '11:00' });

      const future = new Date();
      future.setDate(future.getDate() + 5);
      const result = await service.reschedule('a1', 'p1', future.toISOString().split('T')[0], '11:00');
      expect(result.appointmentTime).toBe('11:00');
    });

    it('debería fallar si el paciente no tiene permiso', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue({ id: 'a1', patient: { id: 'p1' } });
      await expect(service.reschedule('a1', 'p2', '2026-10-10', '10:00'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('debería fallar por conflicto de horario', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue({ id: 'a1', patient: { id: 'p1' }, doctor: { id: 'd1' } });
      mockAppointmentRepository.findOneBy.mockResolvedValue({ id: 'a2' });
      await expect(service.reschedule('a1', 'p1', '2026-10-10', '10:00'))
        .rejects.toThrow(ConflictException);
    });

    it('debería fallar si la ventana de tiempo es inválida (muy pronto)', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue({ id: 'a1', patient: { id: 'p1' }, doctor: { id: 'd1' } });
      mockAppointmentRepository.findOneBy.mockResolvedValue(null);
      const now = new Date();
      const tooSoon = new Date(now.getTime() + 1000 * 60); // 1 minuto después
      await expect(service.reschedule('a1', 'p1', tooSoon.toISOString().split('T')[0], tooSoon.toTimeString().slice(0,5)))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('Consultas y Exportación', () => {
    it('debería exportar citas a CSV', async () => {
      mockAppointmentRepository.find.mockResolvedValue([{ 
        appointmentTime: '08:00', status: 'agendada',
        patient: { firstName: 'Juan', lastName: 'P', document: '1', phone: '1' },
        doctor: { name: 'Dr. S' }
      }]);
      const result = await service.exportAppointmentsByDateAndDoctor('2026-01-01', 'd1');
      expect(result).toContain('08:00');
      expect(result).toContain('Juan P');
    });

    it('debería fallar exportación si no hay citas', async () => {
      mockAppointmentRepository.find.mockResolvedValue([]);
      await expect(service.exportAppointmentsByDateAndDoctor('2026-01-01', 'd1'))
        .rejects.toThrow(NotFoundException);
    });

    it('findAllByPatient debería retornar citas del paciente', async () => {
      mockAppointmentRepository.find.mockResolvedValue([{ id: 'a1' }]);
      const result = await service.findAllByPatient('p1', 'doc1');
      expect(result).toHaveLength(1);
    });
  });

  describe('Confirmación y Dashboard', () => {
    it('confirmAppointment debería cambiar estado a confirmada', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue({ id: '1', status: 'agendada' });
      mockAppointmentRepository.save.mockImplementation(a => Promise.resolve(a));
      const result = await service.confirmAppointment('1');
      expect(result.status).toBe('confirmada');
    });

    it('getDashboardStats debería retornar métricas correctas', async () => {
      mockAppointmentRepository.find.mockResolvedValue([{ id: '1', status: 'agendada', doctor: { id: 'd1' } }]);
      mockDoctorRepository.find.mockResolvedValue([{ id: 'd1', name: 'Dr. A' }]);
      const result = await service.getDashboardStats();
      expect(result.stats.total).toBe(1);
    });
  });

  describe('Cron Jobs', () => {
    it('sendReminders debería emitir eventos', async () => {
      mockAppointmentRepository.find.mockResolvedValue([{ 
        id: '1', patient: { firstName: 'J', lastName: 'P' }, doctor: { name: 'D' } 
      }]);
      await service.sendReminders();
      expect(mockNotificationClient.emit).toHaveBeenCalledWith('appointment.reminder', expect.any(Object));
    });

    it('autoCompletePastAppointments debería ejecutar query builder', async () => {
      await service.autoCompletePastAppointments();
      expect(mockAppointmentRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });
});
