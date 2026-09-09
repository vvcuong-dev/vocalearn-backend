import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class BaseLearningPathDto {
  @ApiProperty({ example: 'Luyện thi HSA - VACT' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  categoryId!: number;

  @ApiPropertyOptional({
    example: 'Các từ vựng liên quan đến kỳ thi HSA - VACT',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example:
      'https://vocalearn.s3.ap-southeast-1.amazonaws.com/learning-paths/1689051870.png',
  })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
