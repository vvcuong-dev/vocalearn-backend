import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { VOCALEARN_ERROR_CODES } from '../../../constants/error-code.constant';

export class ChangeEmailDto {
  @ApiProperty({ example: 'new-email@example.com' })
  @IsNotEmpty({ message: VOCALEARN_ERROR_CODES.USER.EMAIL_REQUIRED })
  @IsEmail({}, { message: VOCALEARN_ERROR_CODES.USER.EMAIL_INVALID })
  newEmail!: string;

  @ApiProperty({
    example: 'CurrentPass@123',
    description: 'Current account password for confirmation',
  })
  @IsString()
  @IsNotEmpty({ message: VOCALEARN_ERROR_CODES.USER.PASSWORD_REQUIRED })
  password!: string;
}
