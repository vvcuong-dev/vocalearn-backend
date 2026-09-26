import { ApiProperty } from '@nestjs/swagger';

export class AccessTokenResponse {
  @ApiProperty({
    description:
      'Access token. Refresh token is only sent in an HttpOnly cookie.',
  })
  accessToken!: string;
}
