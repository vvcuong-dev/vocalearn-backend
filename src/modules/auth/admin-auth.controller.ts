import {
  Controller,
  HttpStatus,
  Body,
  Post,
  HttpCode,
  UseGuards,
  Patch,
  Req,
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
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { RequestWithUser } from '../../common/types/request-with-user.type';
import { VOCALEARN_ERROR_CODES } from '../../constants/error-code.constant';
import { AppException } from '../../common/exceptions/app.exception';
import { LoginResponse } from './response/login.response';
import { RefreshTokenResponse } from './response/refresh-token.response';
import { ActorGuard } from '../../common/guards/actor.guard';
import { ActorType } from '../../constants/actor-type.constant';
import { RequireActor } from '../../common/decorators/actor.decorator';

@ApiTags('Admin Auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful.',
    type: LoginResponse,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  @ApiResponse({ status: 403, description: 'Account not active.' })
  async login(@Body() dto: LoginDto) {
    return await this.adminAuthService.login(dto);
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

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a new token pair using a refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully.',
    type: RefreshTokenResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token.',
  })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return await this.adminAuthService.refreshToken(dto);
  }

  @UseGuards(JwtAuthGuard, ActorGuard)
  @RequireActor(ActorType.ADMIN)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout the authenticated admin' })
  @ApiResponse({ status: 201, description: 'Logout successful.' })
  @ApiResponse({ status: 401, description: 'Invalid or missing access token.' })
  async logout(@Req() req: RequestWithUser) {
    const accessToken = req.headers.authorization?.split(' ')[1];
    if (!accessToken) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.AUTH.INVALID_ACCESS_TOKEN,
        HttpStatus.UNAUTHORIZED,
      );
    }
    return await this.adminAuthService.logout(req.user.id, accessToken);
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
