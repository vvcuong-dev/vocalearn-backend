import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryWordSetDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  learningPathId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  folderId?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPro?: boolean;

  @IsOptional()
  @IsString()
  keyword?: string;
}
