import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { JwtModule as jwtModule } from '@nestjs/jwt';

@Module({
  imports: [jwtModule.register({})],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
