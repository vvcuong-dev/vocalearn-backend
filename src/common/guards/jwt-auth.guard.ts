import { HttpStatus, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppException } from '../exceptions/app.exception';
import { VOCALEARN_ERROR_CODES } from '../../constants/error-code.constant';
import type { AuthUser } from '../types/auth-user.type';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = AuthUser>(
    err: unknown,
    user: TUser | false | null | undefined,
  ): TUser {
    // Preserve errors from validate(), including infrastructure failures.
    if (err) {
      throw err instanceof Error
        ? err
        : new Error('Authentication strategy failed', { cause: err });
    }
    if (!user) {
      // Passport reports missing/expired/invalid JWTs in info as plain Errors.
      // They are authentication failures, not internal server errors.
      throw new AppException(
        VOCALEARN_ERROR_CODES.AUTH.INVALID_ACCESS_TOKEN,
        HttpStatus.UNAUTHORIZED,
      );
    }
    return user;
  }
}
