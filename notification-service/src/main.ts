import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [
          process.env.RABBITMQ_URL ||
            'amqp://piedrazul:piedrazul_pass@localhost:5672',
        ],
        queue: 'notifications_queue',
        queueOptions: {
          durable: true,
        },
        // Prefetch 1: procesa un mensaje a la vez para no sobrecargar el API de WhatsApp
        prefetchCount: 1,
        noAck: false,
      },
    },
  );

  await app.listen();
  console.log('🔔 Notification microservice is listening on RabbitMQ...');
}
bootstrap();
