import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentJobService } from './appointment-job.service';
import { NotificationService } from './notification.service';
import { IAppointmentRepository } from '../ports/appointment.repository';

describe('AppointmentJobService', () => {
  let service: AppointmentJobService;

  const mockAppointmentRepository = {
    createQueryBuilder: jest.fn(),
    find: jest.fn(),
  };

  const mockNotificationService = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentJobService,
        { provide: IAppointmentRepository, useValue: mockAppointmentRepository },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<AppointmentJobService>(AppointmentJobService);
    jest.clearAllMocks();
  });

  describe('autoCompletePastAppointments', () => {
    it('debería ejecutar update query para completar citas pasadas', async () => {
      const mockExecute = jest.fn().mockResolvedValue({ affected: 3 });
      const mockWhere = jest.fn().mockReturnThis();
      const mockAndWhere = jest.fn().mockReturnThis();
      const mockSet = jest.fn().mockReturnThis();
      const mockUpdate = jest.fn().mockReturnValue({ set: mockSet, where: mockWhere, andWhere: mockAndWhere, execute: mockExecute });

      mockAppointmentRepository.createQueryBuilder.mockReturnValue({ update: mockUpdate });

      await service.autoCompletePastAppointments();

      expect(mockAppointmentRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockExecute).toHaveBeenCalled();
    });
  });

  describe('sendReminders', () => {
    it('debería enviar recordatorios para citas del día siguiente', async () => {
      const appointments = [
        {
          id: 'a1',
          appointmentDate: '2026-05-24',
          appointmentTime: '10:00',
          status: 'agendada',
          patient: { id: 'p1', firstName: 'Juan', lastName: 'Pérez', phone: '123456789' },
          doctor: { name: 'Dr. García' },
        },
        {
          id: 'a2',
          appointmentDate: '2026-05-24',
          appointmentTime: '11:00',
          status: 'agendada',
          patient: { id: 'p2', firstName: 'María', lastName: 'López', phone: '987654321' },
          doctor: { name: 'Dr. García' },
        },
      ];

      mockAppointmentRepository.find.mockResolvedValue(appointments);

      await service.sendReminders();

      expect(mockNotificationService.emit).toHaveBeenCalledTimes(2);
      expect(mockNotificationService.emit).toHaveBeenCalledWith(
        'appointment.reminder',
        expect.objectContaining({ appointmentId: 'a1' }),
      );
      expect(mockNotificationService.emit).toHaveBeenCalledWith(
        'appointment.reminder',
        expect.objectContaining({ appointmentId: 'a2' }),
      );
    });

    it('debería manejar el caso sin citas para recordar', async () => {
      mockAppointmentRepository.find.mockResolvedValue([]);
      await service.sendReminders();
      expect(mockNotificationService.emit).not.toHaveBeenCalled();
    });
  });
});
