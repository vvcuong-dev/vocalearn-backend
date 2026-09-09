import { ApiProperty } from '@nestjs/swagger';
import { LearningPath } from '../../../generated/prisma/client';

export class LearningPathResponse {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiProperty() description!: string | null;
  @ApiProperty() slug!: string;
  @ApiProperty() thumbnail!: string | null;
  @ApiProperty() difficulty!: number;
  @ApiProperty() order!: number;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() categoryId!: number;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;

  constructor(learningPath: LearningPath) {
    this.id = learningPath.id;
    this.name = learningPath.name;
    this.description = learningPath.description;
    this.thumbnail = learningPath.thumbnail;
    this.slug = learningPath.slug;
    this.difficulty = learningPath.difficulty;
    this.order = learningPath.order;
    this.isActive = learningPath.isActive;
    this.categoryId = learningPath.categoryId;
    this.createdAt = learningPath.createdAt;
    this.updatedAt = learningPath.updatedAt;
  }
}
