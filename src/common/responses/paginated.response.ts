import { ApiProperty } from '@nestjs/swagger';

export class PaginationMeta {
  @ApiProperty({ example: 1 })
  page!: number;
  @ApiProperty({ example: 10 })
  limit!: number;
  @ApiProperty({ example: 100 })
  totalRecord!: number;
  @ApiProperty({ example: 10 })
  totalPage!: number;

  constructor(data: PaginationMeta) {
    Object.assign(this, data);
  }
}

export class PaginatedResponse<T> {
  @ApiProperty({ isArray: true })
  items!: T[];
  @ApiProperty({ type: () => PaginationMeta })
  pagination!: PaginationMeta;

  constructor(items: T[], pagination: PaginationMeta) {
    this.items = items;
    this.pagination = pagination;
  }
}
