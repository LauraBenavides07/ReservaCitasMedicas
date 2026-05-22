import { Test, TestingModule } from '@nestjs/testing';
import {
  NotificationsClientModule,
  NOTIFICATION_SERVICE,
} from './notifications-client.module';
import { ConfigModule } from '@nestjs/config';

describe('NotificationsClientModule', () => {
  it('debería compilar el módulo', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ ignoreEnvFile: true, ignoreEnvVars: true }),
        NotificationsClientModule,
      ],
    }).compile();

    expect(module).toBeDefined();
  });

  it('debería exportar NOTIFICATION_SERVICE', () => {
    expect(NOTIFICATION_SERVICE).toBe('NOTIFICATION_SERVICE');
  });
});
