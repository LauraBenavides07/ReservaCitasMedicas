import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NOTIFICATION_SERVICE } from '../../infrastructure/messaging/notifications-client.module';

@Injectable()
export class NotificationService {
  constructor(
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationClient: ClientProxy,
  ) {}

  emit(pattern: string, data: Record<string, unknown>): void {
    try {
      this.notificationClient.emit(pattern, data);
    } catch (error) {
      console.error(`[Notification] Error emitiendo evento ${pattern}:`, error);
    }
  }
}
