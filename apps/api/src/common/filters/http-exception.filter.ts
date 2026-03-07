import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Đã có lỗi xảy ra, vui lòng thử lại sau';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp['message'] as string) || message;
        code = (resp['error'] as string) || this.statusToCode(status);
        details = resp['details'];

        // class-validator trả về mảng lỗi — format lại
        if (Array.isArray(resp['message'])) {
          message = 'Dữ liệu không hợp lệ';
          details = resp['message'];
        }
      } else if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        code = this.statusToCode(status);
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unexpected error: ${exception.message}`, exception.stack);
    }

    this.logger.warn(`${request.method} ${request.url} → ${status}: ${message}`);

    response.status(status).json({
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    });
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
    };
    return map[status] || 'UNKNOWN_ERROR';
  }
}
