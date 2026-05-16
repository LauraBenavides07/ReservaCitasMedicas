import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from '../../application/services/appointment.service';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { Response } from 'express';

describe('AppointmentController', () => {
  let controller: AppointmentController;
  let service: AppointmentService;

  const mockAppointmentService = {
    getDashboardStats: jest.fn(),
    exportAppointmentsByDateAndDoctor: jest.fn(),
    findAllByDoctorAndDate: jest.fn(),
    findAllByPatient: jest.fn(),
    create: jest.fn(),
    cancelAppointment: jest.fn(),
    confirmAppointment: jest.fn(),
    reschedule: jest.fn(),
    getAvailableSlots: jest.fn(),
    findAll: jest.fn(),
    findPatientByDocument: jest.fn(),
  };

  const mockJwtAuthGuard = { canActivate: jest.fn(() => true) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentController],
      providers: [
        {
          provide: AppointmentService,
          useValue: mockAppointmentService,
        },
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue(mockJwtAuthGuard)
    .compile();

    controller = module.get<AppointmentController>(AppointmentController);
    service = module.get<AppointmentService>(AppointmentService);
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('Estadísticas y Dashboard', () => {
    it('getDashboardStats debería llamar al servicio', async () => {
      mockAppointmentService.getDashboardStats.mockResolvedValue({ total: 10 });
      const result = await controller.getDashboardStats();
      expect(result.total).toBe(10);
    });
  });

  describe('Exportación CSV', () => {
    it('exportAppointments debería configurar headers y enviar CSV', async () => {
      const mockRes = {
        header: jest.fn(),
        attachment: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      mockAppointmentService.exportAppointmentsByDateAndDoctor.mockResolvedValue('csv-data');
      
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
      
      expect(service.findAllByPatient).toHaveBeenCalledWith('p1', '123');
    });

    it('cancelPatientAppointment debería cancelar usando el ID del paciente en el token', async () => {
      const mockReq = { user: { id: 'p1' } } as any;
      await controller.cancelPatientAppointment('app-1', mockReq);
      expect(service.cancelAppointment).toHaveBeenCalledWith('app-1', 'p1');
    });

    it('reschedulePatientAppointment debería llamar al servicio con datos correctos', async () => {
      const mockReq = { user: { id: 'p1' } } as any;
      const body = { date: '2026-10-10', time: '10:00' };
      await controller.reschedulePatientAppointment('app-1', mockReq, body);
      expect(service.reschedule).toHaveBeenCalledWith('app-1', 'p1', '2026-10-10', '10:00');
    });
  });

  describe('Consultas Generales', () => {
    it('getAvailableSlots debería retornar horarios disponibles', async () => {
      mockAppointmentService.getAvailableSlots.mockResolvedValue(['08:00']);
      const result = await controller.getAvailableSlots('d1', '2026-05-10');
      expect(result).toEqual(['08:00']);
    });

    it('findAllAppointments debería llamar a findAll', async () => {
      await controller.findAllAppointments();
      expect(service.findAll).toHaveBeenCalled();
    });

    it('getPatientByDocument debería llamar al servicio', async () => {
      await controller.getPatientByDocument('123');
      expect(service.findPatientByDocument).toHaveBeenCalledWith('123');
    });
  });
});
