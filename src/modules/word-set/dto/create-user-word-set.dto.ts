import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';
import { BaseWordSetDto } from './base-word-set.dto';

export class CreateUserWordSetDto extends BaseWordSetDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  folderId?: number;
}
