import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from '../../application/services/appointment.service';
import { AvailabilityService } from '../../application/services/availability.service';
import { StatsService } from '../../application/services/stats.service';
import { ExportService } from '../../application/services/export.service';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { Response } from 'express';

describe('AppointmentController', () => {
  let controller: AppointmentController;
  let appointmentService: AppointmentService;
  let availabilityService: AvailabilityService;
  let statsService: StatsService;
  let exportService: ExportService;

  const mockAppointmentService = {
    findAllByDoctorAndDate: jest.fn(),
    findAllByPatient: jest.fn(),
    create: jest.fn(),
    cancelAppointment: jest.fn(),
    confirmAppointment: jest.fn(),
    reschedule: jest.fn(),
    findAll: jest.fn(),
  };

  const mockAvailabilityService = {
    getAvailableSlots: jest.fn(),
  };

  const mockStatsService = {
    getDashboardStats: jest.fn(),
  };

  const mockExportService = {
    exportAppointmentsByDateAndDoctor: jest.fn(),
  };

  const mockJwtAuthGuard = { canActivate: jest.fn(() => true) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentController],
      providers: [
        { provide: AppointmentService, useValue: mockAppointmentService },
        { provide: AvailabilityService, useValue: mockAvailabilityService },
        { provide: StatsService, useValue: mockStatsService },
        { provide: ExportService, useValue: mockExportService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<AppointmentController>(AppointmentController);
    appointmentService = module.get<AppointmentService>(AppointmentService);
    availabilityService = module.get<AvailabilityService>(AvailabilityService);
    statsService = module.get<StatsService>(StatsService);
    exportService = module.get<ExportService>(ExportService);
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('Estadísticas y Dashboard', () => {
    it('getDashboardStats debería llamar a StatsService', async () => {
      mockStatsService.getDashboardStats.mockResolvedValue({
        stats: { total: 10 },
      });
      const result = await controller.getDashboardStats();
      expect(result.stats.total).toBe(10);
    });
  });

  describe('Exportación CSV', () => {
    it('exportAppointments debería delegar a ExportService', async () => {
      const mockRes = {
        header: jest.fn(),
        attachment: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      mockExportService.exportAppointmentsByDateAndDoctor.mockResolvedValue(
        'csv-data',
      );

      await controller.exportAppointments('2026-05-10', 'd-123', mockRes);

      expect(mockRes.header).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockRes.send).toHaveBeenCalledWith('csv-data');
    });
  });

  describe('Citas de Paciente (Auth)', () => {
    it('getPatientAppointments debería usar los datos del usuario del request', async () => {
      const mockReq = { user: { id: 'p1', document: '123' } } as any;
      mockAppointmentService.findAllByPatient.mockResolvedValue([]);

      await controller.getPatientAppointments(mockReq);
      expect(appointmentService.findAllByPatient).toHaveBeenCalledWith(
        'p1',
        '123',
      );
    });
  });

  describe('Consultas Generales', () => {
    it('getAvailableSlots debería delegar a AvailabilityService', async () => {
      mockAvailabilityService.getAvailableSlots.mockResolvedValue(['08:00']);
      const result = await controller.getAvailableSlots('d1', '2026-05-10');
      expect(result).toEqual(['08:00']);
    });

    it('findAllAppointments debería llamar a findAll', async () => {
      await controller.findAllAppointments();
      expect(appointmentService.findAll).toHaveBeenCalled();
    });

    it('getAppointments debería llamar al servicio', async () => {
      await controller.getAppointments('d1', '2026-10-10');
      expect(appointmentService.findAllByDoctorAndDate).toHaveBeenCalledWith(
        'd1',
        '2026-10-10',
        0,
        100,
      );
    });

    it('createAppointment debería llamar al servicio', async () => {
      const dto = { doctorId: 'd1' } as any;
      await controller.createAppointment(dto);
      expect(appointmentService.create).toHaveBeenCalledWith(dto);
    });

    it('confirmAppointment debería llamar al servicio', async () => {
      await controller.confirmAppointment('a1');
      expect(appointmentService.confirmAppointment).toHaveBeenCalledWith('a1');
    });
  });
});
