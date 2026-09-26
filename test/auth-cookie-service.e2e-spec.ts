import { AdminAuthService } from '../src/modules/auth/admin-auth.service';
import { UserAuthService } from '../src/modules/auth/user-auth.service';

jest.mock('../src/modules/mail/mail.service', () => ({
  MailService: class {},
}));

jest.mock('../src/generated/prisma/client', () => ({
  PrismaClient: class {},
  UserStatus: { ACTIVE: 'ACTIVE' },
  AdminStatus: { ACTIVE: 'ACTIVE' },
}));
jest.mock('../src/modules/token/token.service', () => ({
  TokenService: class {},
}));
jest.mock('../src/modules/admin/repositories/admin.repository', () => ({
  AdminRepository: class {},
}));
jest.mock('../src/modules/user/repositories/user.repository', () => ({
  UserRepository: class {},
}));

describe.each([
  ['ADMIN', AdminAuthService],
  ['USER', UserAuthService],
] as const)('%s cookie session service', (role, Service) => {
  const decoded = { sub: 1, role, jti: 'refresh-id' };
  function setup() {
    const repo = {
      findById: jest.fn().mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        status: 'ACTIVE',
      }),
    };
    const token = {
      verifyRefreshToken: jest.fn().mockReturnValue(decoded),
      verifyAccessToken: jest.fn().mockReturnValue({
        ...decoded,
        jti: 'access-id',
        exp: Math.floor(Date.now() / 1000) + 60,
      }),
      generateAccessToken: jest.fn().mockReturnValue({ token: 'access' }),
      generateRefreshToken: jest
        .fn()
        .mockReturnValue({ token: 'rotated', jti: 'next-id' }),
      remainingLifetime: jest.fn().mockReturnValue(3600),
    };
    const redis = {
      getDel: jest.fn().mockResolvedValue('refresh'),
      set: jest.fn().mockResolvedValue('OK'),
    };
    const cache = { deleteByPattern: jest.fn().mockResolvedValue(undefined) };
    const service = new Service(
      repo as never,
      token as never,
      { getClient: () => redis } as never,
      cache as never,
      {} as never,
    );
    return { service, repo, token, redis, cache };
  }
  it('atomically consumes the refresh credential and persists the replacement for its JWT lifetime', async () => {
    const { service, redis, token } = setup();
    await expect(
      service.refreshToken({ refreshToken: 'refresh' }),
    ).resolves.toMatchObject({
      accessToken: 'access',
      refreshToken: 'rotated',
    });
    expect(redis.getDel).toHaveBeenCalledTimes(1);
    expect(token.remainingLifetime).toHaveBeenCalledWith('rotated');
    expect(redis.set).toHaveBeenCalledWith(expect.any(String), 'rotated', {
      EX: 3600,
    });
  });
  it('rejects replayed credentials and inactive accounts', async () => {
    const { service, redis, repo } = setup();
    redis.getDel.mockResolvedValueOnce(null);
    await expect(
      service.refreshToken({ refreshToken: 'refresh' }),
    ).rejects.toMatchObject({ errorCode: 'INVALID_REFRESH_TOKEN' });
    repo.findById.mockResolvedValueOnce({ id: 1, status: 'INACTIVE' });
    await expect(
      service.refreshToken({ refreshToken: 'refresh' }),
    ).rejects.toMatchObject({ errorCode: 'ACCOUNT_NOT_ACTIVE' });
    expect(redis.set).not.toHaveBeenCalled();
  });
  it('logout revokes refresh sessions and blacklists a matching access token', async () => {
    const { service, cache, redis } = setup();
    await service.logoutCookie('refresh', 'access');
    expect(cache.deleteByPattern).toHaveBeenCalledTimes(1);
    expect(redis.set).toHaveBeenCalledTimes(1);
  });
  it('expired or wrong-role cookies cannot revoke another actor session', async () => {
    const { service, token, cache } = setup();
    token.verifyRefreshToken.mockImplementationOnce(() => {
      throw new Error('expired');
    });
    await expect(service.logoutCookie('expired')).resolves.toBe(true);
    token.verifyRefreshToken.mockReturnValueOnce({
      ...decoded,
      role: role === 'ADMIN' ? 'USER' : 'ADMIN',
    });
    await expect(service.logoutCookie('other')).resolves.toBe(true);
    expect(cache.deleteByPattern).not.toHaveBeenCalled();
  });
});
