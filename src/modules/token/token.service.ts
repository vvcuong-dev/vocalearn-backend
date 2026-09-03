import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GeneratedToken, JwtPayload } from '../auth/type/jwt-payload.type';
import { jwtConfig } from '../../configs/jwt.config';
import { randomUUID } from 'crypto';

@Injectable()
export class TokenService {
  constructor(private jwtService: JwtService) {}

  generateAccessToken(payload: Omit<JwtPayload, 'jti'>): GeneratedToken {
    const jti = randomUUID();
    const token = this.jwtService.sign(
      { ...payload, jti },
      {
        secret: jwtConfig.accessSecret,
        expiresIn: jwtConfig.accessExpiresIn,
      },
    );
    return { token, jti };
  }

  generateRefreshToken(payload: Omit<JwtPayload, 'jti'>): GeneratedToken {
    const jti = randomUUID();

    const token = this.jwtService.sign(
      { ...payload, jti },
      {
        secret: jwtConfig.refreshSecret,
        expiresIn: jwtConfig.refreshExpiresIn,
      },
    );
    return { token, jti };
  }

  verifyAccessToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token, {
      secret: jwtConfig.accessSecret,
    });
  }

  verifyRefreshToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token, {
      secret: jwtConfig.refreshSecret,
    });
  }

  decode(token: string): JwtPayload {
    return this.jwtService.decode<JwtPayload>(token);
  }
}
