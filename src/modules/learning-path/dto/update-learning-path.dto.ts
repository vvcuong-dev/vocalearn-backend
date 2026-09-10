import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';
import { BaseLearningPathDto } from './base-learning-path.dto';

export class UpdateLearningPathDto extends BaseLearningPathDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}
