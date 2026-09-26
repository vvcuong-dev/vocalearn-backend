import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response, CookieOptions } from 'express';
import { decode } from 'jsonwebtoken';
import { appConfig } from '../../configs/app.config';
import { AppException } from '../../common/exceptions/app.exception';

export type CookieActor = 'admin' | 'user';
const cookieName = (actor: CookieActor) => `vocalearn_${actor}_refresh`;
function options(actor: CookieActor): CookieOptions {
  const sameSite = process.env.AUTH_COOKIE_SAME_SITE || 'lax';
  if (!['lax', 'strict', 'none'].includes(sameSite))
    throw new Error('Invalid AUTH_COOKIE_SAME_SITE');
  const secure =
    process.env.NODE_ENV === 'production' ||
    process.env.AUTH_COOKIE_SECURE === 'true';
  if (sameSite === 'none' && !secure)
    throw new Error('SameSite=None requires Secure cookies');
  return {
    httpOnly: true,
    secure,
    sameSite: sameSite as 'lax' | 'strict' | 'none',
    path: actor === 'admin' ? '/api/admin/auth' : '/api/auth',
  };
}
export function clearAuthCookie(res: Response, actor: CookieActor) {
  res.setHeader('Cache-Control', 'no-store');
  res.clearCookie(cookieName(actor), options(actor));
}
export function setAuthCookie(
  res: Response,
  actor: CookieActor,
  token: string,
  remember: boolean,
) {
  const payload = decode(token);
  if (!payload || typeof payload === 'string' || !payload.exp)
    throw new Error('Refresh token has no expiration');
  res.setHeader('Cache-Control', 'no-store');
  res.cookie(cookieName(actor), `${remember ? '1' : '0'}:${token}`, {
    ...options(actor),
    ...(remember ? { expires: new Date(payload.exp * 1000) } : {}),
  });
}
export function readAuthCookie(
  req: Request,
  actor: CookieActor,
): { token: string; remember: boolean } | undefined {
  const prefix = `${cookieName(actor)}=`;
  const raw = req.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  if (!raw) return;
  try {
    const value = decodeURIComponent(raw.slice(prefix.length));
    if (!/^[01]:.+$/.test(value)) return;
    return { token: value.slice(2), remember: value.startsWith('1:') };
  } catch {
    return;
  }
}

@Injectable()
export class CookieOriginGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const origin = req.headers.origin;
    // The custom header forces a CORS preflight for cross-origin browser requests.
    if (
      req.headers['x-csrf-protection'] !== '1' ||
      (origin && !appConfig.corsOrigins.includes(origin))
    ) {
      throw new AppException('CSRF_ORIGIN_REJECTED', HttpStatus.FORBIDDEN);
    }
    return true;
  }
}
