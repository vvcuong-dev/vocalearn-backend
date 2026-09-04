import {
  IsOptional,
  IsPhoneNumber,
  MaxLength,
  MinLength,
} from 'class-validator';

import { VOCALEARN_ERROR_CODES } from '../../../constants/error-code.constant';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAdminProfileDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn A', minLength: 5, maxLength: 50 })
  @IsOptional()
  @MinLength(5, { message: VOCALEARN_ERROR_CODES.USER.NAME_TOO_SHORT })
  @MaxLength(50, { message: VOCALEARN_ERROR_CODES.USER.NAME_TOO_LONG })
  name?: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  @IsPhoneNumber('VN', { message: VOCALEARN_ERROR_CODES.USER.PHONE_INVALID })
  phone?: string;
}
