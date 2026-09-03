import { IsNotEmpty, IsStrongPassword, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { VOCALEARN_ERROR_CODES } from '../../../constants/error-code.constant';

const { USER } = VOCALEARN_ERROR_CODES;

export class ResetPasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({
    example: 'NewPass@456',
    description:
      'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.',
    maxLength: 72,
  })
  @MaxLength(72, { message: USER.PASSWORD_TOO_LONG })
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    { message: USER.PASSWORD_TOO_WEAK },
  )
  @IsNotEmpty({ message: USER.PASSWORD_REQUIRED })
  newPassword!: string;
}
