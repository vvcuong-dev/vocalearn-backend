import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';
import { BaseLearningPathDto } from './base-learning-path.dto';

export class UpdateLearningPathDto extends PartialType(BaseLearningPathDto) {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}
