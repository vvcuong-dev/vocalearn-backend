import { ApiProperty } from '@nestjs/swagger';
import { TokenPairResponse } from './token-pair.response';

export class LoginResponse {
  @ApiProperty({ type: TokenPairResponse })
  tokens!: TokenPairResponse;

  constructor(tokens: TokenPairResponse) {
    this.tokens = tokens;
  }
}
