import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [
          process.env.RABBITMQ_URL ||
            'amqp://guest:guest@localhost:5672',
        ],
        queue: 'notifications_queue',        
        queueOptions: {
          durable: true,                    // La cola persiste si RabbitMQ reinicia
        },
        prefetchCount: 1,                  // Un mensaje a la vez
        noAck: false,                      // Confirmación manual (ACK)
      },
    },
  );

  await app.listen();
  logger.log('🔔 Microservicio de Notificaciones escuchando en RabbitMQ');
}
bootstrap();