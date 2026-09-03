import {
  IsEmail,
  IsNotEmpty,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { VOCALEARN_ERROR_CODES } from '../../../constants/error-code.constant';

const { USER } = VOCALEARN_ERROR_CODES;

export class RegisterDto {
  @ApiProperty({ example: 'Nguyễn Văn A', minLength: 5, maxLength: 50 })
  @MinLength(5, { message: USER.NAME_TOO_SHORT })
  @MaxLength(50, { message: USER.NAME_TOO_LONG })
  @IsNotEmpty({ message: USER.NAME_REQUIRED })
  name!: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: USER.EMAIL_INVALID })
  @IsNotEmpty({ message: USER.EMAIL_REQUIRED })
  email!: string;

  @ApiProperty({
    example: 'Abcd@1234',
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
  password!: string;
}
