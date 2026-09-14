import { IsInt, IsNotEmpty } from 'class-validator';

export class MoveWordSetDto {
  @IsNotEmpty()
  @IsInt()
  learningPathId!: number;
}
