import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ValidateNested } from 'class-validator';

class ReorderItem {
  @ApiProperty({ example: 1 })
  @IsInt()
  id!: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  order!: number;
}

export class ReorderWordSetDto {
  @ApiProperty({
    type: [ReorderItem],
    example: [
      { id: 1, order: 2 },
      { id: 2, order: 1 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItem)
  items!: ReorderItem[];
}
