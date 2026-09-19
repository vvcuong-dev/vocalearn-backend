import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { BaseWordDto } from './base-word.dto';

export class CreateWordDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  wordSetId!: number;

  @ApiProperty({ type: [BaseWordDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => BaseWordDto)
  words!: BaseWordDto[];
}
