import { Test, TestingModule } from '@nestjs/testing';
import { StatsService } from './stats.service';
import { IAppointmentRepository } from '../ports/appointment.repository';
import { IDoctorRepository } from '../ports/doctor.repository';

describe('StatsService', () => {
  let service: StatsService;

  const mockAppointmentRepository = {
    find: jest.fn(),
  };

  const mockDoctorRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        {
          provide: IAppointmentRepository,
          useValue: mockAppointmentRepository,
        },
        { provide: IDoctorRepository, useValue: mockDoctorRepository },
      ],
    }).compile();

    service = module.get<StatsService>(StatsService);
    jest.clearAllMocks();
  });

  it('debería retornar estadísticas del dashboard', async () => {
    mockDoctorRepository.find.mockResolvedValue([
      { id: 'd1', name: 'García' },
      { id: 'd2', name: 'López' },
    ]);

    mockAppointmentRepository.find.mockResolvedValue([
      { status: 'agendada', doctor: { id: 'd1' } },
      { status: 'agendada', doctor: { id: 'd1' } },
      { status: 'completada', doctor: { id: 'd2' } },
      { status: 'cancelada', doctor: { id: 'd1' } },
    ]);

    const result = await service.getDashboardStats();

    expect(result.stats.total).toBe(4);
    expect(result.stats.scheduled).toBe(2);
    expect(result.stats.completed).toBe(1);
    expect(result.stats.cancelled).toBe(1);
    expect(result.doctorStats).toHaveLength(2);
  });

  it('debería manejar el caso sin citas', async () => {
    mockDoctorRepository.find.mockResolvedValue([{ id: 'd1', name: 'García' }]);
    mockAppointmentRepository.find.mockResolvedValue([]);

    const result = await service.getDashboardStats();

    expect(result.stats.total).toBe(0);
    expect(result.stats.scheduled).toBe(0);
    expect(result.doctorStats).toHaveLength(1);
  });

  it('debería calcular porcentajes correctamente', async () => {
    mockDoctorRepository.find.mockResolvedValue([
      { id: 'd1', name: 'García' },
      { id: 'd2', name: 'López' },
    ]);

    mockAppointmentRepository.find.mockResolvedValue([
      { status: 'agendada', doctor: { id: 'd1' } },
      { status: 'agendada', doctor: { id: 'd1' } },
      { status: 'agendada', doctor: { id: 'd2' } },
    ]);

    const result = await service.getDashboardStats();

    expect(result.doctorStats[0].name).toBe('Dr(a). García');
    expect(result.doctorStats[0].count).toBe(2);
    expect(result.doctorStats[0].percentage).toBe(67);
    expect(result.doctorStats[1].count).toBe(1);
    expect(result.doctorStats[1].percentage).toBe(33);
  });
});
