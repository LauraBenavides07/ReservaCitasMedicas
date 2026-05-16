import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationLogService } from './notification-log.service';
import { NotificationLog } from './notification-log.entity';

describe('NotificationLogService', () => {
  let service: NotificationLogService;
  let repo: jest.Mocked<Repository<NotificationLog>>;

  const mockLog: NotificationLog = {
    id: 1,
    evento: 'CITA_CREADA',
    destinatario: 'test@example.com',
    estado: 'ENVIADO',
    mensaje: 'Cita creada para Paciente',
    fecha_envio: new Date('2026-05-16'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationLogService,
        {
          provide: getRepositoryToken(NotificationLog),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationLogService>(NotificationLogService);
    repo = module.get(getRepositoryToken(NotificationLog));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('guardarLog', () => {
    it('should create and save a log entry', async () => {
      const data = {
        evento: 'CITA_CREADA',
        destinatario: 'test@example.com',
        estado: 'ENVIADO',
        mensaje: 'Cita creada',
      };

      repo.create.mockReturnValue(mockLog);
      repo.save.mockResolvedValue(mockLog);

      const result = await service.guardarLog(data);

      expect(repo.create).toHaveBeenCalledWith(data);
      expect(repo.save).toHaveBeenCalledWith(mockLog);
      expect(result).toEqual(mockLog);
    });

    it('should handle different event types', async () => {
      const cancelData = {
        evento: 'CITA_CANCELADA',
        destinatario: 'patient@test.com',
        estado: 'ENVIADO',
        mensaje: 'Cita cancelada',
      };
      const cancelLog = { ...mockLog, ...cancelData };

      repo.create.mockReturnValue(cancelLog);
      repo.save.mockResolvedValue(cancelLog);

      const result = await service.guardarLog(cancelData);
      expect(repo.create).toHaveBeenCalledWith(cancelData);
      expect(result.evento).toBe('CITA_CANCELADA');
    });
  });

  describe('obtenerLogs', () => {
    it('should return logs ordered by fecha_envio DESC', async () => {
      const logs = [mockLog, { ...mockLog, id: 2, fecha_envio: new Date('2026-05-15') }];
      repo.find.mockResolvedValue(logs);

      const result = await service.obtenerLogs();

      expect(repo.find).toHaveBeenCalledWith({ order: { fecha_envio: 'DESC' } });
      expect(result).toEqual(logs);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no logs exist', async () => {
      repo.find.mockResolvedValue([]);

      const result = await service.obtenerLogs();

      expect(result).toEqual([]);
    });
  });
});
