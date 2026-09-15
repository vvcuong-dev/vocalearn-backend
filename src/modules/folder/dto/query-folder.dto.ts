import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryFolderDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'TOEIC' })
  @IsOptional()
  @IsString()
  keyword?: string;
}
