import { Test, TestingModule } from '@nestjs/testing';
import { ExportService } from './export.service';
import { NotFoundException } from '@nestjs/common';
import { ICsvExporter } from '../abstractions/icsv-exporter.interface';
import { IAppointmentRepository } from '../ports/appointment.repository';

describe('ExportService', () => {
  let service: ExportService;

  const mockAppointmentRepository = {
    find: jest.fn(),
  };

  const mockCsvExporter = {
    export: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportService,
        {
          provide: IAppointmentRepository,
          useValue: mockAppointmentRepository,
        },
        { provide: ICsvExporter, useValue: mockCsvExporter },
      ],
    }).compile();

    service = module.get<ExportService>(ExportService);
    jest.clearAllMocks();
  });

  it('debería exportar citas como CSV', async () => {
    const appointments = [
      {
        appointmentTime: '10:00',
        status: 'agendada',
        patient: {
          firstName: 'Juan',
          lastName: 'Pérez',
          document: '123',
          phone: '555-0001',
        },
        doctor: { name: 'Dr. García' },
      },
      {
        appointmentTime: '11:00',
        status: 'completada',
        patient: {
          firstName: 'María',
          lastName: 'López',
          document: '456',
          phone: '555-0002',
        },
        doctor: { name: 'Dr. García' },
      },
    ];

    mockAppointmentRepository.find.mockResolvedValue(appointments);
    mockCsvExporter.export.mockReturnValue('csv,content');

    const result = await service.exportAppointmentsByDateAndDoctor(
      '2026-10-10',
      'd1',
    );

    expect(result).toBe('csv,content');
    expect(mockAppointmentRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { appointmentDate: '2026-10-10', doctor: { id: 'd1' } },
      }),
    );
    expect(mockCsvExporter.export).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ Hora: '10:00', Paciente: 'Juan Pérez' }),
        expect.objectContaining({ Hora: '11:00', Paciente: 'María López' }),
      ]),
    );
  });

  it('debería lanzar NotFoundException si no hay citas', async () => {
    mockAppointmentRepository.find.mockResolvedValue([]);
    await expect(
      service.exportAppointmentsByDateAndDoctor('2026-10-10', 'd1'),
    ).rejects.toThrow(NotFoundException);
  });
});
