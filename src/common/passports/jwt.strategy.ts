import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { HttpStatus } from '@nestjs/common';

import { RedisService } from '../../modules/redis/redis.service';
import { UserService } from '../../modules/user/user.service';
import { jwtConfig } from '../../configs/jwt.config';
import { UserStatus } from '../../generated/prisma/enums';
import { AuthUser } from '../types/auth-user.type';
import { JwtPayload } from 'jsonwebtoken';
import { CACHE } from '../../constants/cache.constant';
import { AppException } from '../exceptions/app.exception';
import { VOCALEARN_ERROR_CODES } from '../../constants/error-code.constant';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.accessSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (payload.jti) {
      const redisClient = this.redisService.getClient();
      const blacklisted = await redisClient.get(
        CACHE.AUTH._KEY.BLACKLIST(payload.jti),
      );

      if (blacklisted) {
        throw new AppException(
          VOCALEARN_ERROR_CODES.AUTH.INVALID_CREDENTIALS,
          HttpStatus.UNAUTHORIZED,
        );
      }
    }

    if (!payload.sub) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.AUTH.INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this.userService.findById(Number(payload.sub));

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.AUTH.INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
      );
    }
    return {
      id: user.id,
      email: user.email,
      status: user.status,
      roleId: user.roleId,
    };
  }
}
