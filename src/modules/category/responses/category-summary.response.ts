import { ApiProperty } from '@nestjs/swagger';
import { Category } from '../../../generated/prisma/client';

export class CategorySummaryResponse {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;

  constructor(category: Category) {
    this.id = category.id;
    this.name = category.name;
    this.slug = category.slug;
  }
}
