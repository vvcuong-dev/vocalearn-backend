import type { Request, Response } from 'express';
import {
  CookieOriginGuard,
  readAuthCookie,
  setAuthCookie,
  clearAuthCookie,
} from './auth-cookie';
import { AccessTokenResponse } from './response/access-token.response';
import {
  Controller,
  HttpStatus,
  Body,
  Post,
  HttpCode,
  UseGuards,
  Patch,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminAuthService } from './admin-auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { RequestWithUser } from '../../common/types/request-with-user.type';
import { VOCALEARN_ERROR_CODES } from '../../constants/error-code.constant';
import { AppException } from '../../common/exceptions/app.exception';
import { ActorGuard } from '../../common/guards/actor.guard';
import { ActorType } from '../../constants/actor-type.constant';
import { RequireActor } from '../../common/decorators/actor.decorator';

@ApiTags('Admin Auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @UseGuards(CookieOriginGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful.',
    type: AccessTokenResponse,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  @ApiResponse({ status: 403, description: 'Account not active.' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.adminAuthService.login(dto);
    setAuthCookie(
      res,
      'admin',
      result.tokens.refreshToken,
      dto.remember ?? true,
    );
    return { accessToken: result.tokens.accessToken };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email for admin' })
  @ApiResponse({
    status: 200,
    description: 'If the email exists, a reset link has been sent.',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return await this.adminAuthService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset admin password using a token from email' })
  @ApiResponse({ status: 200, description: 'Password reset successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset token.' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return await this.adminAuthService.resetPassword(dto);
  }

  @UseGuards(CookieOriginGuard)
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using the HttpOnly cookie' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully.',
    type: AccessTokenResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token.',
  })
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookie = readAuthCookie(req, 'admin');
    if (!cookie) {
      clearAuthCookie(res, 'admin');
      throw new AppException(
        VOCALEARN_ERROR_CODES.AUTH.INVALID_REFRESH_TOKEN,
        HttpStatus.UNAUTHORIZED,
      );
    }
    try {
      const result = await this.adminAuthService.refreshToken({
        refreshToken: cookie.token,
      });
      setAuthCookie(res, 'admin', result.refreshToken, cookie.remember);
      return { accessToken: result.accessToken };
    } catch (error) {
      if (
        error instanceof AppException &&
        [401, 403, 404].includes(error.getStatus())
      )
        clearAuthCookie(res, 'admin');
      throw error;
    }
  }

  @UseGuards(CookieOriginGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke the cookie session and clear its cookie' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.adminAuthService.logoutCookie(
      readAuthCookie(req, 'admin')?.token,
      req.headers.authorization?.split(' ')[1],
    );
    clearAuthCookie(res, 'admin');
    return true;
  }

  @UseGuards(JwtAuthGuard, ActorGuard)
  @RequireActor(ActorType.ADMIN)
  @Patch('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change the password of the authenticated admin' })
  @ApiResponse({ status: 200, description: 'Password changed successfully.' })
  @ApiResponse({ status: 400, description: 'Old password is incorrect.' })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: RequestWithUser,
  ) {
    return await this.adminAuthService.changePassword(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard, ActorGuard)
  @RequireActor(ActorType.ADMIN)
  @Patch('change-email')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change the email of the authenticated admin' })
  @ApiResponse({ status: 200, description: 'Email changed successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Password is incorrect or new email is the same as old.',
  })
  @ApiResponse({ status: 409, description: 'New email already in use.' })
  async changeEmail(@Body() dto: ChangeEmailDto, @Req() req: RequestWithUser) {
    return await this.adminAuthService.changeEmail(req.user.id, dto);
  }
}
