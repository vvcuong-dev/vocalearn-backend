import {
  IsEmail,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  IsStrongPassword,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { VOCALEARN_ERROR_CODES } from '../../../constants/error-code.constant';

const { USER } = VOCALEARN_ERROR_CODES;

export class LoginDto {
  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  remember?: boolean;
  @ApiProperty({ example: 'cuongvudev2911@gmail.com' })
  @IsEmail({}, { message: USER.EMAIL_INVALID })
  @IsNotEmpty({ message: USER.EMAIL_REQUIRED })
  email!: string;

  @ApiProperty({ example: 'LeVanA@123456', maxLength: 72 })
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
