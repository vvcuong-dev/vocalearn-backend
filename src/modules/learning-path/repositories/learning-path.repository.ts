import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { LearningPath } from '../../../generated/prisma/client';

@Injectable()
export class LearningPathRepository extends BaseRepository<
  LearningPath,
  number
> {
  constructor(prisma: PrismaService) {
    super('LearningPath', prisma);
  }
  async findBySlug(
    slug: string,
    excludeId?: number,
  ): Promise<LearningPath | null> {
    return this.delegate.findFirst({
      where: {
        slug,
        deleted: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  async findDuplicateByName(
    name: string,
    categoryId: number,
    excludeId?: number,
  ): Promise<LearningPath | null> {
    return this.delegate.findFirst({
      where: {
        name,
        categoryId,
        deleted: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  async findActiveById(id: number): Promise<LearningPath | null> {
    return await this.delegate.findFirst({
      where: {
        id,
        deleted: false,
      },
    });
  }

  async findGroupedByCategory(categoryId?: number) {
    return this.prisma.category.findMany({
      where: {
        deleted: false,
        ...(categoryId !== undefined ? { id: categoryId } : {}),
      },
      orderBy: [{ order: 'asc' }],
      include: {
        learningPaths: {
          where: { deleted: false, isActive: true },
          orderBy: [{ order: 'asc' }],
        },
      },
    });
  }
}
