import { HttpException, HttpStatus } from '@nestjs/common';
import { IAuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { AppException } from '../src/common/exceptions/app.exception';

describe('JwtAuthGuard authentication failures', () => {
  const guard: IAuthGuard = new JwtAuthGuard();

  it.each([
    'No auth token',
    'jwt expired',
    'invalid signature',
    'jwt malformed',
  ])('returns 401 when Passport reports %s', (message) => {
    let thrown: unknown;
    try {
      guard.handleRequest(null, false, new Error(message), {} as never);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(HttpException);
    expect((thrown as HttpException).getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    expect((thrown as HttpException).getResponse()).toMatchObject({
      errorCode: 'INVALID_ACCESS_TOKEN',
    });
  });

  it('preserves application errors raised by the strategy', () => {
    const error = new AppException('ACCOUNT_NOT_ACTIVE', HttpStatus.FORBIDDEN);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    expect(() => guard.handleRequest(error, null, null, {} as never)).toThrow(
      error,
    );
  });

  it('does not hide infrastructure errors as authentication failures', () => {
    const error = new Error('Redis unavailable');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    expect(() => guard.handleRequest(error, null, null, {} as never)).toThrow(
      error,
    );
  });

  it('returns the authenticated user', () => {
    const user = { id: 1, actorType: 'ADMIN' };
    expect(guard.handleRequest(null, user, undefined, {} as never)).toBe(user);
  });
});
