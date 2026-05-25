import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || message;
    } else if (exception instanceof Error) {
      this.logger.error(`No controlado: ${exception.message}`, exception.stack);
    }

    response.status(status).json({
      statusCode: status,
      message: Array.isArray(message) ? message : [message],
      timestamp: new Date().toISOString(),
    });
  }
}

export interface ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void;
}
