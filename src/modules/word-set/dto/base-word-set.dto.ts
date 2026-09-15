import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BaseWordSetDto {
  @ApiProperty({ example: 'Từ vựng TOEIC - Công việc' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Các từ vựng thường gặp tại nơi làm việc' })
  @IsOptional()
  @IsString()
  description?: string;
}
