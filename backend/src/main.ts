import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './infrastructure/filters/all-exceptions.filter';
import type { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para el frontend
  app.enableCors();

  // CSP headers
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'",
    );
    next();
  });

  // Filtro global de excepciones
  app.useGlobalFilters(new AllExceptionsFilter());

  // Habilitar validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
