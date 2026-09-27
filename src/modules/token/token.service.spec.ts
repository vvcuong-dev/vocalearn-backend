import { JwtService } from '@nestjs/jwt';
import { TokenService } from './token.service';
import { AuthRole } from '../auth/type/jwt-payload.type';

jest.mock('../../configs/jwt.config', () => ({
  jwtConfig: {
    accessSecret: 'test-access-secret',
    refreshSecret: 'test-refresh-secret',
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
  },
}));

describe('refresh token lifetime', () => {
  const service = new TokenService(new JwtService());

  it.each([
    [AuthRole.USER, 30],
    [AuthRole.ADMIN, 7],
  ])('%s refresh tokens expire after %i days', (role, days) => {
    const { token } = service.generateRefreshToken({
      sub: 1,
      email: 'test@example.com',
      role,
    });
    const payload = service.verifyRefreshToken(token);
    expect(payload.exp! - payload.iat!).toBe(days * 24 * 60 * 60);
  });

  it('renews the user expiration from the refresh time', () => {
    jest.useFakeTimers();
    try {
      const payload = {
        sub: 1,
        email: 'test@example.com',
        role: AuthRole.USER,
      };
      const first = service.generateRefreshToken(payload);
      jest.advanceTimersByTime(24 * 60 * 60 * 1000);
      const next = service.generateRefreshToken(payload);
      expect(
        service.verifyRefreshToken(next.token).exp! -
          service.verifyRefreshToken(first.token).exp!,
      ).toBe(24 * 60 * 60);
    } finally {
      jest.useRealTimers();
    }
  });
});
