import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
  constructor(
    public readonly errorCode: string,
    status: HttpStatus,
    message?: string,
  ) {
    super(
      { statusCode: status, errorCode, message: message ?? errorCode },
      status,
    );
  }
}
