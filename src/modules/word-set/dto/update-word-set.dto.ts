import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';
import { BaseWordSetDto } from './base-word-set.dto';

export class UpdateWordSetDto extends BaseWordSetDto {
  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isPro?: boolean;

  @ApiPropertyOptional({ example: 2, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}
