import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../common/repositories/base.repository';
import type { Category } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CategoryRepository extends BaseRepository<Category, number> {
  constructor(prisma: PrismaService) {
    super('Category', prisma);
  }

  async findBySlug(slug: string, excludeId?: number): Promise<Category | null> {
    return this.delegate.findFirst({
      where: {
        slug,
        deleted: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  async findActiveById(id: number): Promise<Category | null> {
    return await this.delegate.findFirst({
      where: {
        id,
        deleted: false,
      },
    });
  }
}
