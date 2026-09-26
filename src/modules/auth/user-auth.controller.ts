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
import { UserAuthService } from './user-auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { RequestWithUser } from '../../common/types/request-with-user.type';
import { VOCALEARN_ERROR_CODES } from '../../constants/error-code.constant';
import { AppException } from '../../common/exceptions/app.exception';
import { UserResponse } from '../user/responses/user.response';
import { ActorGuard } from '../../common/guards/actor.guard';
import { ActorType } from '../../constants/actor-type.constant';
import { RequireActor } from '../../common/decorators/actor.decorator';

@ApiTags('User Auth')
@Controller('auth')
export class UserAuthController {
  constructor(private readonly userAuthService: UserAuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully.',
    type: UserResponse,
  })
  @ApiResponse({ status: 409, description: 'Email already exists.' })
  async register(@Body() dto: RegisterDto) {
    return await this.userAuthService.register(dto);
  }

  @UseGuards(CookieOriginGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
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
    const result = await this.userAuthService.login(dto);
    setAuthCookie(
      res,
      'user',
      result.tokens.refreshToken,
      dto.remember ?? true,
    );
    return { accessToken: result.tokens.accessToken };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiResponse({
    status: 200,
    description: 'If the email exists, a reset link has been sent.',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return await this.userAuthService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using a token from email' })
  @ApiResponse({ status: 200, description: 'Password reset successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset token.' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return await this.userAuthService.resetPassword(dto);
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
    const cookie = readAuthCookie(req, 'user');
    if (!cookie) {
      clearAuthCookie(res, 'user');
      throw new AppException(
        VOCALEARN_ERROR_CODES.AUTH.INVALID_REFRESH_TOKEN,
        HttpStatus.UNAUTHORIZED,
      );
    }
    try {
      const result = await this.userAuthService.refreshToken({
        refreshToken: cookie.token,
      });
      setAuthCookie(res, 'user', result.refreshToken, cookie.remember);
      return { accessToken: result.accessToken };
    } catch (error) {
      if (
        error instanceof AppException &&
        [401, 403, 404].includes(error.getStatus())
      )
        clearAuthCookie(res, 'user');
      throw error;
    }
  }

  @UseGuards(CookieOriginGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke the cookie session and clear its cookie' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.userAuthService.logoutCookie(
      readAuthCookie(req, 'user')?.token,
      req.headers.authorization?.split(' ')[1],
    );
    clearAuthCookie(res, 'user');
    return true;
  }

  @UseGuards(JwtAuthGuard, ActorGuard)
  @RequireActor(ActorType.USER)
  @Patch('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change the password of the authenticated user' })
  @ApiResponse({ status: 200, description: 'Password changed successfully.' })
  @ApiResponse({ status: 400, description: 'Old password is incorrect.' })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: RequestWithUser,
  ) {
    return await this.userAuthService.changePassword(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard, ActorGuard)
  @RequireActor(ActorType.USER)
  @Patch('change-email')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change the email of the authenticated user' })
  @ApiResponse({ status: 200, description: 'Email changed successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Password is incorrect or new email is the same as old.',
  })
  @ApiResponse({ status: 409, description: 'New email already in use.' })
  async changeEmail(@Body() dto: ChangeEmailDto, @Req() req: RequestWithUser) {
    return await this.userAuthService.changeEmail(req.user.id, dto);
  }
}
