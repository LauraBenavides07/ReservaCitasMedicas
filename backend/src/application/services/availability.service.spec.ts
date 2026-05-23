import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityService } from './availability.service';
import { ConfigService } from './config.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { IAppointmentRepository } from '../ports/appointment.repository';
import { IDoctorRepository } from '../ports/doctor.repository';
import { IDoctorExceptionRepository } from '../ports/doctor-exception.repository';

describe('AvailabilityService', () => {
  let service: AvailabilityService;

  const mockAppointmentRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
  };

  const mockDoctorRepository = {
    findOneBy: jest.fn(),
  };

  const mockDoctorExceptionRepository = {
    findOneBy: jest.fn(),
  };

  const mockConfigService = {
    getConfig: jest.fn().mockResolvedValue({
      minAdvanceHours: 2,
      appointmentWindowDays: 15,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        { provide: IAppointmentRepository, useValue: mockAppointmentRepository },
        { provide: IDoctorRepository, useValue: mockDoctorRepository },
        { provide: IDoctorExceptionRepository, useValue: mockDoctorExceptionRepository },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AvailabilityService>(AvailabilityService);
    jest.clearAllMocks();
    mockConfigService.getConfig.mockResolvedValue({
      minAdvanceHours: 2,
      appointmentWindowDays: 15,
    });
  });

  describe('getAvailableSlots', () => {
    it('debería retornar slots disponibles para un médico', async () => {
      const doctor = {
        id: 'd1',
        scheduleStart: '08:00',
        scheduleEnd: '09:00',
        slotDuration: 30,
        lunchStart: null,
        lunchEnd: null,
        isWorkingDay: jest.fn().mockReturnValue(true),
        scheduleStartMinutes: jest.fn().mockReturnValue(480),
        scheduleEndMinutes: jest.fn().mockReturnValue(540),
        lunchStartMinutes: jest.fn().mockReturnValue(null),
        lunchEndMinutes: jest.fn().mockReturnValue(null),
      };
      mockDoctorRepository.findOneBy.mockResolvedValue(doctor);
      mockDoctorExceptionRepository.findOneBy.mockResolvedValue(null);
      mockAppointmentRepository.find.mockResolvedValue([]);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const slots = await service.getAvailableSlots('d1', dateStr);
      expect(slots.length).toBeGreaterThan(0);
      expect(slots).toContain('08:00');
    });

    it('debería retornar lista vacía si el médico no existe', async () => {
      mockDoctorRepository.findOneBy.mockResolvedValue(null);
      await expect(service.getAvailableSlots('invalid', '2026-10-10')).rejects.toThrow(NotFoundException);
    });

    it('debería retornar lista vacía si hay excepción', async () => {
      const doctor = {
        id: 'd1',
        isWorkingDay: jest.fn().mockReturnValue(true),
      };
      mockDoctorRepository.findOneBy.mockResolvedValue(doctor);
      mockDoctorExceptionRepository.findOneBy.mockResolvedValue({ id: 'e1', reason: 'Feriado' });

      const slots = await service.getAvailableSlots('d1', '2026-10-10');
      expect(slots).toEqual([]);
    });

    it('debería retornar lista vacía si no es día laboral', async () => {
      const doctor = {
        id: 'd1',
        isWorkingDay: jest.fn().mockReturnValue(false),
      };
      mockDoctorRepository.findOneBy.mockResolvedValue(doctor);
      mockDoctorExceptionRepository.findOneBy.mockResolvedValue(null);

      const slots = await service.getAvailableSlots('d1', '2026-10-10');
      expect(slots).toEqual([]);
    });

    it('debería excluir slots ya reservados', async () => {
      const doctor = {
        id: 'd1',
        scheduleStart: '08:00',
        scheduleEnd: '09:00',
        slotDuration: 30,
        lunchStart: null,
        lunchEnd: null,
        isWorkingDay: jest.fn().mockReturnValue(true),
        scheduleStartMinutes: jest.fn().mockReturnValue(480),
        scheduleEndMinutes: jest.fn().mockReturnValue(540),
        lunchStartMinutes: jest.fn().mockReturnValue(null),
        lunchEndMinutes: jest.fn().mockReturnValue(null),
      };
      mockDoctorRepository.findOneBy.mockResolvedValue(doctor);
      mockDoctorExceptionRepository.findOneBy.mockResolvedValue(null);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      mockAppointmentRepository.find.mockResolvedValue([
        { appointmentTime: '08:00' },
      ]);

      const slots = await service.getAvailableSlots('d1', dateStr);
      expect(slots).not.toContain('08:00');
    });
  });

  describe('validateTimeWindow', () => {
    it('debería pasar si la fecha está dentro de la ventana', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      await expect(service.validateTimeWindow(dateStr, '10:00')).resolves.toBeUndefined();
    });

    it('debería fallar si la fecha es pasada', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];
      await expect(service.validateTimeWindow(dateStr, '10:00')).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateDoctorException', () => {
    it('debería pasar si no hay excepción', async () => {
      mockDoctorExceptionRepository.findOneBy.mockResolvedValue(null);
      await expect(service.validateDoctorException('d1', '2026-10-10')).resolves.toBeUndefined();
    });

    it('debería fallar si hay excepción para el médico en esa fecha', async () => {
      mockDoctorExceptionRepository.findOneBy.mockResolvedValue({ id: 'e1', reason: 'Capacitación' });
      await expect(service.validateDoctorException('d1', '2026-10-10')).rejects.toThrow(BadRequestException);
    });
  });

  describe('isSlotAvailable', () => {
    it('debería retornar true si el slot está libre', async () => {
      mockAppointmentRepository.findOneBy.mockResolvedValue(null);
      const result = await service.isSlotAvailable('d1', '2026-10-10', '10:00');
      expect(result).toBe(true);
    });

    it('debería retornar false si el slot está ocupado', async () => {
      mockAppointmentRepository.findOneBy.mockResolvedValue({ id: 'a1' });
      const result = await service.isSlotAvailable('d1', '2026-10-10', '10:00');
      expect(result).toBe(false);
    });

    it('debería ignorar la cita excluida', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue({ id: 'a1' });
      const result = await service.isSlotAvailable('d1', '2026-10-10', '10:00', 'a1');
      expect(result).toBe(true);
    });
  });

  describe('assertSlotAvailable', () => {
    it('debería pasar si el slot está libre', async () => {
      mockAppointmentRepository.findOneBy.mockResolvedValue(null);
      await expect(service.assertSlotAvailable('d1', '2026-10-10', '10:00')).resolves.toBeUndefined();
    });

    it('debería fallar si el slot está ocupado', async () => {
      mockAppointmentRepository.findOneBy.mockResolvedValue({ id: 'a1' });
      await expect(service.assertSlotAvailable('d1', '2026-10-10', '10:00')).rejects.toThrow(BadRequestException);
    });
  });
});
