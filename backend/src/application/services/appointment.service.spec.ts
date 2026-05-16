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
    mockConfigService.getConfig.mockResolvedValue({ minAdvanceHours: 2, appointmentWindowDays: 15 });
  });

  describe('findAllByDoctorAndDate', () => {
    it('debería listar citas sin fecha', async () => {
      mockAppointmentRepository.findAndCount.mockResolvedValue([[], 0]);
      const result = await service.findAllByDoctorAndDate('d1');
      expect(result.total).toBe(0);
      expect(mockAppointmentRepository.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        where: { doctor: { id: 'd1' } }
      }));
    });

    it('debería listar citas con fecha', async () => {
      mockAppointmentRepository.findAndCount.mockResolvedValue([[], 0]);
      await service.findAllByDoctorAndDate('d1', '2026-10-10');
      expect(mockAppointmentRepository.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        where: { doctor: { id: 'd1' }, appointmentDate: '2026-10-10' }
      }));
    });
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
      
      const dto: CreateAppointmentDto = {
        patientDocument: '123', firstName: 'J', lastName: 'P', phone: '123', gender: 'M',
        doctorId: 'd1', date: tomorrowStr, time: '10:00'
      };

      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(mockNotificationClient.emit).toHaveBeenCalledWith('appointment.created', expect.any(Object));
    });

    it('debería crear el paciente si no existe', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      mockDoctorRepository.findOneBy.mockResolvedValue({ id: 'd1', name: 'Dr. S' });
      mockPatientRepository.findOneBy.mockResolvedValue(null);
      mockPatientRepository.create.mockReturnValue({ firstName: 'New' });
      mockAppointmentRepository.findOneBy.mockResolvedValue(null);
      mockAppointmentRepository.create.mockReturnValue({ id: 'a1' });
      mockAppointmentRepository.save.mockResolvedValue({ id: 'a1' });

      await service.create({
        patientDocument: '999', firstName: 'New', lastName: 'P', phone: '123', gender: 'M',
        doctorId: 'd1', date: tomorrowStr, time: '10:00'
      });

      expect(mockPatientRepository.create).toHaveBeenCalled();
      expect(mockPatientRepository.save).toHaveBeenCalled();
    });

    it('debería fallar si el doctor no existe', async () => {
      mockDoctorRepository.findOneBy.mockResolvedValue(null);
      await expect(service.create({ doctorId: 'invalid' } as any)).rejects.toThrow(NotFoundException);
    });

    it('debería fallar si es con poca antelación', async () => {
      mockDoctorRepository.findOneBy.mockResolvedValue({ id: 'd1' });
      const now = new Date();
      const tooSoonStr = now.toISOString().split('T')[0];
      const tooSoonTime = `${now.getHours()}:${now.getMinutes()}`;
      
      await expect(service.create({ doctorId: 'd1', date: tooSoonStr, time: tooSoonTime } as any))
        .rejects.toThrow(BadRequestException);
    });

    it('debería fallar si es con demasiada antelación', async () => {
      mockDoctorRepository.findOneBy.mockResolvedValue({ id: 'd1' });
      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 30);
      const farStr = farFuture.toISOString().split('T')[0];
      
      await expect(service.create({ doctorId: 'd1', date: farStr, time: '10:00' } as any))
        .rejects.toThrow(BadRequestException);
    });

    it('debería fallar si el médico tiene una excepción ese día', async () => {
      mockDoctorRepository.findOneBy.mockResolvedValue({ id: 'd1' });
      mockDoctorExceptionRepository.findOneBy.mockResolvedValue({ reason: 'Congreso' });
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      await expect(service.create({ doctorId: 'd1', date: tomorrowStr, time: '10:00' } as any))
        .rejects.toThrow(BadRequestException);
    });

    it('debería fallar si el horario está ocupado', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      mockDoctorRepository.findOneBy.mockResolvedValue({ id: 'd1' });
      mockDoctorExceptionRepository.findOneBy.mockResolvedValue(null);
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

    it('debería fallar si el doctor no existe', async () => {
      mockDoctorRepository.findOneBy.mockResolvedValue(null);
      await expect(service.getAvailableSlots('d1', '2026-05-20')).rejects.toThrow(NotFoundException);
    });

    it('debería marcar como ocupados los horarios ya reservados', async () => {
      mockDoctorRepository.findOneBy.mockResolvedValue({ 
        id: 'd1', scheduleStart: '08:00', scheduleEnd: '10:00', slotDuration: 60, activeDays: '1,2,3,4,5,6,7'
      });
      mockAppointmentRepository.find.mockResolvedValue([{ appointmentTime: '08:00' }]);
      mockDoctorExceptionRepository.findOneBy.mockResolvedValue(null);

      const future = new Date();
      future.setDate(future.getDate() + 3);
      const result = await service.getAvailableSlots('d1', future.toISOString().split('T')[0]);
      expect(result).not.toContain('08:00');
      expect(result).toContain('09:00');
    });
  });

  describe('cancelAppointment', () => {
    it('debería cancelar una cita con éxito', async () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);
      const dateStr = future.toISOString().split('T')[0];

      const app = { 
        id: 'a1', status: 'agendada', appointmentDate: dateStr, appointmentTime: '10:00',
        patient: { id: 'p1', firstName: 'J', lastName: 'P', phone: '1' },
        doctor: { name: 'D' }
      };
      mockAppointmentRepository.findOne.mockResolvedValue(app);
      mockAppointmentRepository.save.mockResolvedValue({ ...app, status: 'cancelada' });

      const result = await service.cancelAppointment('a1', 'p1');
      expect(result.status).toBe('cancelada');
      expect(mockNotificationClient.emit).toHaveBeenCalledWith('appointment.cancelled', expect.any(Object));
    });

    it('debería fallar si la cita no existe', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue(null);
      await expect(service.cancelAppointment('a1', 'p1')).rejects.toThrow(NotFoundException);
    });

    it('debería fallar si el paciente no tiene permiso', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue({ id: 'a1', patient: { id: 'p1', keycloakId: 'k1' } });
      await expect(service.cancelAppointment('a1', 'other')).rejects.toThrow(UnauthorizedException);
    });

    it('debería fallar si la cita es pasada', async () => {
      const past = new Date();
      past.setDate(past.getDate() - 1);
      const dateStr = past.toISOString().split('T')[0];

      mockAppointmentRepository.findOne.mockResolvedValue({ 
        id: 'a1', appointmentDate: dateStr, appointmentTime: '10:00', patient: { id: 'p1' } 
      });
      await expect(service.cancelAppointment('a1', 'p1')).rejects.toThrow(BadRequestException);
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

    it('debería fallar si la cita no existe', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue(null);
      await expect(service.reschedule('a1', 'p1', '2026-10-10', '10:00')).rejects.toThrow(NotFoundException);
    });

    it('debería fallar si el paciente no tiene permiso', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue({ id: 'a1', patient: { id: 'p1' } });
      await expect(service.reschedule('a1', 'p2', '2026-10-10', '10:00'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('debería fallar si se intenta reagendar con poca antelación', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue({ id: 'a1', patient: { id: 'p1' }, doctor: { id: 'd1' } });
      const now = new Date();
      const tooSoon = new Date(now.getTime() + 1000 * 60); // 1 minuto después
      await expect(service.reschedule('a1', 'p1', tooSoon.toISOString().split('T')[0], tooSoon.toTimeString().slice(0,5)))
        .rejects.toThrow(BadRequestException);
    });

    it('debería fallar si es con demasiada antelación', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue({ id: 'a1', patient: { id: 'p1' }, doctor: { id: 'd1' } });
      mockAppointmentRepository.findOneBy.mockResolvedValue(null);
      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 30);
      await expect(service.reschedule('a1', 'p1', farFuture.toISOString().split('T')[0], '10:00'))
        .rejects.toThrow(BadRequestException);
    });

    it('debería fallar si el médico tiene excepción el nuevo día', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue({ id: 'a1', patient: { id: 'p1' }, doctor: { id: 'd1' } });
      mockAppointmentRepository.findOneBy.mockResolvedValue(null);
      mockDoctorExceptionRepository.findOneBy.mockResolvedValue({ reason: 'No disponible' });

      const future = new Date();
      future.setDate(future.getDate() + 5);
      await expect(service.reschedule('a1', 'p1', future.toISOString().split('T')[0], '10:00'))
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
      mockPatientRepository.findOneBy.mockResolvedValue({ document: '123' });
      const result = await service.findPatientByDocument('123');
      expect(result.document).toBe('123');
    });

    it('findPatientByDocument debería fallar si no existe', async () => {
      mockPatientRepository.findOneBy.mockResolvedValue(null);
      await expect(service.findPatientByDocument('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('Confirmación y Dashboard', () => {
    it('confirmAppointment debería cambiar estado a confirmada', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue({ id: '1', status: 'agendada' });
      mockAppointmentRepository.save.mockImplementation(a => Promise.resolve(a));
      const result = await service.confirmAppointment('1');
      expect(result.status).toBe('confirmada');
    });

    it('confirmAppointment debería fallar si no existe', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue(null);
      await expect(service.confirmAppointment('1')).rejects.toThrow(NotFoundException);
    });

    it('confirmAppointment debería fallar si está cancelada', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue({ id: '1', status: 'cancelada' });
      await expect(service.confirmAppointment('1')).rejects.toThrow(BadRequestException);
    });

    it('getDashboardStats debería retornar métricas y ordenar doctores por cantidad', async () => {
      mockAppointmentRepository.find.mockResolvedValue([
        { id: '1', status: 'agendada', doctor: { id: 'd1' } },
        { id: '2', status: 'agendada', doctor: { id: 'd2' } },
        { id: '3', status: 'agendada', doctor: { id: 'd2' } },
      ]);
      mockDoctorRepository.find.mockResolvedValue([
        { id: 'd1', name: 'Dr. Uno' },
        { id: 'd2', name: 'Dr. Dos' },
      ]);
      const result = await service.getDashboardStats();
      expect(result.doctorStats[0].name).toContain('Dr. Dos'); // d2 tiene 2 citas
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
