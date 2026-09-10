import { ApiProperty } from '@nestjs/swagger';
import { Category, LearningPath } from '../../../generated/prisma/client';
import { LearningPathPublicResponse } from './learning-path-public.response';

class CategoryBrief {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
}

export class LearningPathGroupedByCategoryResponse {
  @ApiProperty({ type: CategoryBrief })
  category!: CategoryBrief;

  @ApiProperty()
  totalCount!: number;

  @ApiProperty({ type: [LearningPathPublicResponse] })
  learningPaths!: LearningPathPublicResponse[];

  constructor(category: Category, learningPaths: LearningPath[]) {
    this.category = {
      id: category.id,
      name: category.name,
      slug: category.slug,
    };
    this.totalCount = learningPaths.length;
    this.learningPaths = learningPaths.map(
      (lp) => new LearningPathPublicResponse(lp),
    );
  }
}
