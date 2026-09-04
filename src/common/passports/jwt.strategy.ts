import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { HttpStatus } from '@nestjs/common';

import { RedisService } from '../../modules/redis/redis.service';
import { UserService } from '../../modules/user/user.service';
import { AdminRepository } from '../../modules/admin/repositories/admin.repository';
import { jwtConfig } from '../../configs/jwt.config';
import { UserStatus, AdminStatus } from '../../generated/prisma/enums';
import { AuthUser } from '../types/auth-user.type';
import { JwtPayload, AuthRole } from '../../modules/auth/type/jwt-payload.type';
import { ActorType } from '../../constants/actor-type.constant';
import { CACHE } from '../../constants/cache.constant';
import { AppException } from '../exceptions/app.exception';
import { VOCALEARN_ERROR_CODES } from '../../constants/error-code.constant';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserService,
    private readonly adminRepository: AdminRepository,
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

    if (!payload.sub || !payload.role) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.AUTH.INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (payload.role === AuthRole.ADMIN) {
      const admin = await this.adminRepository.findById(Number(payload.sub));
      if (!admin || admin.status !== AdminStatus.ACTIVE) {
        throw new AppException(
          VOCALEARN_ERROR_CODES.AUTH.INVALID_CREDENTIALS,
          HttpStatus.UNAUTHORIZED,
        );
      }
      return {
        id: admin.id,
        email: admin.email,
        status: admin.status,
        actorType: ActorType.ADMIN,
      };
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
      actorType: ActorType.USER,
    };
  }
}
