import { IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MoveWordSetDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsInt()
  learningPathId!: number;
}
