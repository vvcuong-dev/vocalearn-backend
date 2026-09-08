import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryCategoryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'IELTS' })
  @IsOptional()
  @IsString()
  keyword?: string;
}
