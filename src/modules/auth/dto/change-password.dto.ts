import {
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { VOCALEARN_ERROR_CODES } from '../../../constants/error-code.constant';

const { USER } = VOCALEARN_ERROR_CODES;

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPass@123' })
  @IsString()
  @IsNotEmpty({ message: USER.PASSWORD_REQUIRED })
  oldPassword!: string;

  @ApiProperty({ example: 'NewPass@456', maxLength: 72 })
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
