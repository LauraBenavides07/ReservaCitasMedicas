import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { ClientProxy } from '@nestjs/microservices';
import { NOTIFICATION_SERVICE } from '../../infrastructure/messaging/notifications-client.module';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockClient: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockClient = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: NOTIFICATION_SERVICE, useValue: mockClient },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('debería emitir un evento al cliente de notificaciones', () => {
    mockClient.emit.mockReturnValue({ subscribe: jest.fn() });
    service.emit('appointment.created', { appointmentId: 'a1' });
    expect(mockClient.emit).toHaveBeenCalledWith('appointment.created', { appointmentId: 'a1' });
  });

  it('debería manejar errores sin lanzar excepción', () => {
    mockClient.emit.mockImplementation(() => { throw new Error('Connection refused'); });
    expect(() => service.emit('appointment.created', { appointmentId: 'a1' })).not.toThrow();
  });
});
