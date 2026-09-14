import { Type } from 'class-transformer';
import { IsArray, IsInt, ValidateNested } from 'class-validator';

class ReorderItem {
  @IsInt()
  id!: number;

  @IsInt()
  order!: number;
}

export class ReorderWordSetDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItem)
  items!: ReorderItem[];
}
