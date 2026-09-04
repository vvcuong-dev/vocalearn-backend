import { Module } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { UserAuthService } from './user-auth.service';
import { AdminAuthController } from './admin-auth.controller';
import { UserAuthController } from './user-auth.controller';
import { AdminRepository } from '../admin/repositories/admin.repository';
import { TokenModule } from '../token/token.module';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from '../user/user.module';
import { JwtStrategy } from '../../common/passports/jwt.strategy';
import { RedisModule } from '../redis/redis.module';
import { MailModule } from '../mail/mail.module';

@Module({
  controllers: [AdminAuthController, UserAuthController],
  providers: [AdminAuthService, UserAuthService, AdminRepository, JwtStrategy],
  imports: [PassportModule, TokenModule, UserModule, RedisModule, MailModule],
  exports: [JwtStrategy],
})
export class AuthModule {}
