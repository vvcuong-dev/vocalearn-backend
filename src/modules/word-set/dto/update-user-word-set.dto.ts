import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';
import { BaseWordSetDto } from './base-word-set.dto';

export class UpdateUserWordSetDto extends BaseWordSetDto {
  @ApiPropertyOptional({ example: 2, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}
