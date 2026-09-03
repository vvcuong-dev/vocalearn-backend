import { ApiProperty } from '@nestjs/swagger';
import { UserResponse } from '../../user/responses/user.response';
import { TokenPairResponse } from './token-pair.response';

export class LoginResponse {
  @ApiProperty({ type: UserResponse })
  user!: UserResponse;

  @ApiProperty({ type: TokenPairResponse })
  tokens!: TokenPairResponse;

  constructor(user: UserResponse, tokens: TokenPairResponse) {
    this.user = user;
    this.tokens = tokens;
  }
}
