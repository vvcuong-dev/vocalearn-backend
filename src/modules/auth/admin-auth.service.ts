import { HttpStatus, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { AdminRepository } from '../admin/repositories/admin.repository';
import { VOCALEARN_ERROR_CODES } from '../../constants/error-code.constant';
import { comparePassword, hashPassword } from '../../utils/password.util';
import { TokenService } from '../token/token.service';
import { AppException } from '../../common/exceptions/app.exception';
import { RedisService } from '../redis/redis.service';
import { CacheService } from '../redis/cache.service';
import { MailService } from '../mail/mail.service';
import { CACHE, TTL } from '../../constants/cache.constant';
import { mailConfig } from '../../configs/mail.config';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LoginResponse } from './response/login.response';
import { RefreshTokenResponse } from './response/refresh-token.response';
import { JwtPayload, AuthRole } from './type/jwt-payload.type';
import { AdminStatus } from '../../generated/prisma/client';
import { ActorType } from '../../constants/actor-type.constant';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly tokenService: TokenService,
    private readonly redisService: RedisService,
    private readonly cacheService: CacheService,
    private readonly mailService: MailService,
  ) {}

  private get redis() {
    return this.redisService.getClient();
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const admin = await this.adminRepository.findByEmail(dto.email);
    const isValidPassword =
      admin && (await comparePassword(dto.password, admin.password));

    if (!isValidPassword) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.AUTH.INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (admin.status !== AdminStatus.ACTIVE) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.AUTH.ACCOUNT_NOT_ACTIVE,
        HttpStatus.FORBIDDEN,
      );
    }

    const payload: Omit<JwtPayload, 'jti' | 'exp'> = {
      sub: admin.id,
      email: admin.email,
      role: AuthRole.ADMIN,
    };

    const { token: accessToken } =
      this.tokenService.generateAccessToken(payload);
    const { token: refreshToken, jti: refreshJti } =
      this.tokenService.generateRefreshToken(payload);

    await this.redis.set(
      CACHE.AUTH._KEY.REFRESH_TOKEN(ActorType.ADMIN, admin.id, refreshJti),
      refreshToken,
      { EX: this.tokenService.remainingLifetime(refreshToken) },
    );

    return new LoginResponse({ accessToken, refreshToken });
  }

  async refreshToken(dto: RefreshTokenDto): Promise<RefreshTokenResponse> {
    let decoded: JwtPayload;
    try {
      decoded = this.tokenService.verifyRefreshToken(dto.refreshToken);
    } catch {
      throw new AppException(
        VOCALEARN_ERROR_CODES.AUTH.INVALID_REFRESH_TOKEN,
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (decoded.role !== AuthRole.ADMIN || !decoded.jti) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.AUTH.INVALID_REFRESH_TOKEN,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const oldKey = CACHE.AUTH._KEY.REFRESH_TOKEN(
      ActorType.ADMIN,
      decoded.sub,
      decoded.jti,
    );
    const exists = await this.redis.getDel(oldKey);
    if (exists !== dto.refreshToken) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.AUTH.INVALID_REFRESH_TOKEN,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const admin = await this.adminRepository.findById(decoded.sub);
    if (!admin) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.USER.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    if (admin.status !== AdminStatus.ACTIVE) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.AUTH.ACCOUNT_NOT_ACTIVE,
        HttpStatus.FORBIDDEN,
      );
    }

    const payload: Omit<JwtPayload, 'jti' | 'exp'> = {
      sub: admin.id,
      email: admin.email,
      role: AuthRole.ADMIN,
    };
    const { token: newAccessToken } =
      this.tokenService.generateAccessToken(payload);
    const { token: newRefreshToken, jti: newJti } =
      this.tokenService.generateRefreshToken(payload);

    await this.redis.set(
      CACHE.AUTH._KEY.REFRESH_TOKEN(ActorType.ADMIN, admin.id, newJti),
      newRefreshToken,
      { EX: this.tokenService.remainingLifetime(newRefreshToken) },
    );

    return new RefreshTokenResponse(newAccessToken, newRefreshToken);
  }

  async changePassword(
    adminId: number,
    dto: ChangePasswordDto,
  ): Promise<boolean> {
    const admin = await this.adminRepository.findById(adminId);
    if (!admin) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.USER.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    const isMatch = await comparePassword(dto.oldPassword, admin.password);
    if (!isMatch) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.AUTH.OLD_PASSWORD_INCORRECT,
        HttpStatus.BAD_REQUEST,
      );
    }
    const hashedNewPassword = await hashPassword(dto.newPassword);
    await this.adminRepository.update(adminId, { password: hashedNewPassword });
    return true;
  }

  async changeEmail(adminId: number, dto: ChangeEmailDto): Promise<boolean> {
    const admin = await this.adminRepository.findById(adminId);
    if (!admin) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.USER.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    const isMatch = await comparePassword(dto.password, admin.password);
    if (!isMatch) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.AUTH.PASSWORD_INCORRECT,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (dto.newEmail === admin.email) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.USER.EMAIL_SAME_AS_OLD,
        HttpStatus.BAD_REQUEST,
      );
    }
    const existing = await this.adminRepository.findByEmail(dto.newEmail);
    if (existing) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.USER.EMAIL_ALREADY_EXISTS,
        HttpStatus.CONFLICT,
      );
    }
    await this.adminRepository.update(adminId, { email: dto.newEmail });
    return true;
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<boolean> {
    const admin = await this.adminRepository.findByEmail(dto.email);
    if (!admin) return true;

    const resetToken = crypto.randomBytes(32).toString('hex');
    await this.redis.set(
      CACHE.AUTH._KEY.RESET_PASSWORD(resetToken),
      `${ActorType.ADMIN}:${admin.id}`,
      { EX: TTL.MEDIUM },
    );

    const resetLink = `${mailConfig.adminResetPasswordUrl}?token=${resetToken}`;
    await this.mailService.queueForgotPasswordEmail({
      toEmail: admin.email,
      userName: admin.name,
      resetLink,
    });
    return true;
  }

  async resetPassword(dto: ResetPasswordDto): Promise<boolean> {
    const key = CACHE.AUTH._KEY.RESET_PASSWORD(dto.token);
    const stored = await this.redis.get(key);
    if (!stored || !stored.startsWith(`${ActorType.ADMIN}:`)) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.AUTH.INVALID_RESET_TOKEN,
        HttpStatus.BAD_REQUEST,
      );
    }
    const adminId = Number(stored.split(':')[1]);
    const admin = await this.adminRepository.findById(adminId);
    if (!admin) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.USER.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    const hashedNewPassword = await hashPassword(dto.newPassword);
    await this.adminRepository.update(admin.id, {
      password: hashedNewPassword,
    });
    await this.cacheService.delete(key);
    await this.cacheService.deleteByPattern(
      CACHE.AUTH._PATTERN.ALL_REFRESH_TOKENS(ActorType.ADMIN, admin.id),
    );
    return true;
  }

  async logoutCookie(
    refreshToken?: string,
    accessToken?: string,
  ): Promise<boolean> {
    if (!refreshToken) return true;
    let decoded: JwtPayload;
    try {
      decoded = this.tokenService.verifyRefreshToken(refreshToken);
    } catch {
      return true;
    }
    if (decoded.role !== AuthRole.ADMIN || !decoded.jti) return true;
    await this.cacheService.deleteByPattern(
      CACHE.AUTH._PATTERN.ALL_REFRESH_TOKENS(ActorType.ADMIN, decoded.sub),
    );
    if (accessToken) {
      let access: JwtPayload;
      try {
        access = this.tokenService.verifyAccessToken(accessToken);
      } catch {
        return true;
      }
      if (
        access.role === decoded.role &&
        access.sub === decoded.sub &&
        access.jti &&
        access.exp
      ) {
        const ttl = access.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0)
          await this.redis.set(CACHE.AUTH._KEY.BLACKLIST(access.jti), 'admin', {
            EX: ttl,
          });
      }
    }
    return true;
  }
}
