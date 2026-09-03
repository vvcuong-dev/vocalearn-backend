import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsStrongPassword,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

import { UserStatus } from '../../../generated/prisma/client';
import { VOCALEARN_ERROR_CODES } from '../../../constants/error-code.constant';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'Nguyễn Văn A', minLength: 5, maxLength: 50 })
  @IsNotEmpty({ message: VOCALEARN_ERROR_CODES.USER.NAME_REQUIRED })
  @MinLength(5, { message: VOCALEARN_ERROR_CODES.USER.NAME_TOO_SHORT })
  @MaxLength(50, { message: VOCALEARN_ERROR_CODES.USER.NAME_TOO_LONG })
  name!: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty({ message: VOCALEARN_ERROR_CODES.USER.EMAIL_REQUIRED })
  @IsEmail({}, { message: VOCALEARN_ERROR_CODES.USER.EMAIL_INVALID })
  email!: string;

  @ApiProperty({
    example: 'Abcd@1234',
    description:
      'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.',
    maxLength: 50,
  })
  @IsNotEmpty({ message: VOCALEARN_ERROR_CODES.USER.PASSWORD_REQUIRED })
  @MaxLength(50, { message: VOCALEARN_ERROR_CODES.USER.PASSWORD_TOO_LONG })
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    { message: VOCALEARN_ERROR_CODES.USER.PASSWORD_TOO_WEAK },
  )
  password!: string;

  @ApiPropertyOptional({ enum: UserStatus, default: UserStatus.PENDING })
  @IsOptional()
  @IsEnum(UserStatus, { message: VOCALEARN_ERROR_CODES.USER.STATUS_INVALID })
  status?: UserStatus = UserStatus.PENDING;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/.../avatar.jpg' })
  @IsUrl({}, { message: VOCALEARN_ERROR_CODES.USER.AVATAR_INVALID })
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  @IsPhoneNumber('VN', { message: VOCALEARN_ERROR_CODES.USER.PHONE_INVALID })
  phone?: string;
}
