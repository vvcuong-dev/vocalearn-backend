import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { VOCALEARN_ERROR_CODES } from '../../constants/error-code.constant';
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'object') {
        return response.status(status).json({
          success: false,
          ...res,
        });
      }

      return response.status(status).json({
        success: false,
        statusCode: status,
        errorCode: VOCALEARN_ERROR_CODES.COMMON.UNKNOWN_ERROR,
        message: res,
      });
    }

    this.logger.error(exception);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: VOCALEARN_ERROR_CODES.COMMON.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }
}
