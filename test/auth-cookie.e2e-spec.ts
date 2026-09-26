import type { Server } from 'node:http';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { sign } from 'jsonwebtoken';
import { AdminAuthController } from '../src/modules/auth/admin-auth.controller';
import { UserAuthController } from '../src/modules/auth/user-auth.controller';
import { AdminAuthService } from '../src/modules/auth/admin-auth.service';
import { UserAuthService } from '../src/modules/auth/user-auth.service';
import { AppException } from '../src/common/exceptions/app.exception';

jest.mock('../src/modules/auth/admin-auth.service', () => ({
  AdminAuthService: class {},
}));
jest.mock('../src/modules/auth/user-auth.service', () => ({
  UserAuthService: class {},
}));
jest.mock('../src/generated/prisma/client', () => ({
  UserStatus: { ACTIVE: 'ACTIVE' },
}));

describe('HttpOnly auth cookies', () => {
  let app: INestApplication;
  const token = sign({ sub: 1 }, 'cookie-test-only', { expiresIn: '1h' });
  const services = {
    admin: {
      login: jest.fn(),
      refreshToken: jest.fn(),
      logoutCookie: jest.fn(),
    },
    user: {
      login: jest.fn(),
      refreshToken: jest.fn(),
      logoutCookie: jest.fn(),
    },
  };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AdminAuthController, UserAuthController],
      providers: [
        { provide: AdminAuthService, useValue: services.admin },
        { provide: UserAuthService, useValue: services.user },
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableCors({
      origin: ['http://localhost:5173'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Protection'],
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });
  beforeEach(() => {
    for (const service of Object.values(services)) {
      service.login.mockReset().mockResolvedValue({
        tokens: { accessToken: 'access', refreshToken: token },
      });
      service.refreshToken
        .mockReset()
        .mockResolvedValue({ accessToken: 'renewed', refreshToken: token });
      service.logoutCookie.mockReset().mockResolvedValue(true);
    }
  });
  afterAll(async () => {
    await app.close();
  });

  for (const actor of ['admin', 'user'] as const) {
    const base = actor === 'admin' ? '/api/admin/auth' : '/api/auth';
    const cookie = (remember = '1') =>
      `vocalearn_${actor}_refresh=${encodeURIComponent(`${remember}:${token}`)}`;
    it(`${actor} production login uses Secure and supports a session cookie`, async () => {
      const original = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        const res = await request(app.getHttpServer() as Server)
          .post(`${base}/login`)
          .set('X-CSRF-Protection', '1')
          .send({
            email: 'test@example.com',
            password: 'Pass@1234',
            remember: false,
          })
          .expect(200);
        expect(res.headers['set-cookie'][0]).toContain('; Secure');
        expect(res.headers['set-cookie'][0]).toContain('; HttpOnly');
        expect(res.headers['set-cookie'][0]).not.toContain('Expires=');
      } finally {
        if (original === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = original;
      }
    });
    it(`${actor} login sets HttpOnly cookie and never exposes refresh token in JSON`, async () => {
      const res = await request(app.getHttpServer() as Server)
        .post(`${base}/login`)
        .set('Origin', 'http://localhost:5173')
        .set('X-CSRF-Protection', '1')
        .send({
          email: 'test@example.com',
          password: 'Pass@1234',
          remember: true,
        })
        .expect(200);
      expect(res.body).toEqual({ accessToken: 'access' });
      expect(JSON.stringify(res.body)).not.toContain(token);
      expect(res.headers['set-cookie'][0]).toContain('HttpOnly');
      expect(res.headers['set-cookie'][0]).toContain(`Path=${base}`);
      expect(res.headers['set-cookie'][0]).toContain('SameSite=Lax');
      expect(res.headers['set-cookie'][0]).toContain('Expires=');
      expect(res.headers['cache-control']).toBe('no-store');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });
    it(`${actor} refresh reads only its cookie and preserves session-cookie lifetime`, async () => {
      const res = await request(app.getHttpServer() as Server)
        .post(`${base}/refresh-token`)
        .set('X-CSRF-Protection', '1')
        .set('Cookie', cookie('0'))
        .expect(200);
      expect(services[actor].refreshToken).toHaveBeenCalledWith({
        refreshToken: token,
      });
      expect(res.body).toEqual({ accessToken: 'renewed' });
      expect(res.headers['set-cookie'][0]).not.toContain('Expires=');
      expect(res.headers['set-cookie'][0]).not.toContain('Max-Age=');
    });
    it(`${actor} ignores refresh tokens in JSON and cookies for the other actor`, async () => {
      const other = actor === 'admin' ? 'user' : 'admin';
      await request(app.getHttpServer() as Server)
        .post(`${base}/refresh-token`)
        .set('X-CSRF-Protection', '1')
        .set(
          'Cookie',
          `vocalearn_${other}_refresh=${encodeURIComponent(`1:${token}`)}`,
        )
        .send({ refreshToken: token })
        .expect(401);
      expect(services[actor].refreshToken).not.toHaveBeenCalled();
    });
    it(`${actor} rejects missing CSRF header and untrusted origins`, async () => {
      await request(app.getHttpServer() as Server)
        .post(`${base}/refresh-token`)
        .set('Cookie', cookie())
        .expect(403);
      await request(app.getHttpServer() as Server)
        .post(`${base}/refresh-token`)
        .set('X-CSRF-Protection', '1')
        .set('Origin', 'https://evil.example')
        .set('Cookie', cookie())
        .expect(403);
      expect(services[actor].refreshToken).not.toHaveBeenCalled();
    });
    it(`${actor} logout revokes cookie session without requiring an access token`, async () => {
      const res = await request(app.getHttpServer() as Server)
        .post(`${base}/logout`)
        .set('X-CSRF-Protection', '1')
        .set('Cookie', cookie())
        .expect(200);
      expect(services[actor].logoutCookie).toHaveBeenCalledWith(
        token,
        undefined,
      );
      expect(res.headers['set-cookie'][0]).toContain(
        'Expires=Thu, 01 Jan 1970',
      );
    });
    it(`${actor} only clears cookies for definitive auth failures`, async () => {
      services[actor].refreshToken.mockRejectedValueOnce(
        new AppException('INVALID_REFRESH_TOKEN', 401),
      );
      const expired = await request(app.getHttpServer() as Server)
        .post(`${base}/refresh-token`)
        .set('X-CSRF-Protection', '1')
        .set('Cookie', cookie())
        .expect(401);
      expect(expired.headers['set-cookie'][0]).toContain(
        'Expires=Thu, 01 Jan 1970',
      );
      services[actor].refreshToken.mockRejectedValueOnce(
        new AppException('UNAVAILABLE', 503),
      );
      const unavailable = await request(app.getHttpServer() as Server)
        .post(`${base}/refresh-token`)
        .set('X-CSRF-Protection', '1')
        .set('Cookie', cookie())
        .expect(503);
      expect(unavailable.headers['set-cookie']).toBeUndefined();
    });
  }
});
