import { ApiProperty } from '@nestjs/swagger';
import { Category } from '../../../generated/prisma/client';

export class CategoryResponse {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() order!: number;
  @ApiProperty() description?: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;

  constructor(category: Category) {
    this.id = category.id;
    this.name = category.name;
    this.slug = category.slug;
    this.order = category.order;
    this.description = (
      category as { description?: string | null }
    ).description;
    this.createdAt = category.createdAt;
    this.updatedAt = category.updatedAt;
  }
}
