import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { Folder, Prisma } from '../../../generated/prisma/client';
import { FolderEntity } from '../responses/folder.response';

@Injectable()
export class FolderRepository extends BaseRepository<Folder, number> {
  constructor(prisma: PrismaService) {
    super('Folder', prisma);
  }

  async findBySlug(slug: string, excludeId?: number): Promise<Folder | null> {
    return this.delegate.findFirst({
      where: {
        slug,
        deleted: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  async findFirstByWhere(
    where: Prisma.FolderWhereInput,
  ): Promise<Folder | null> {
    return this.delegate.findFirst({ where });
  }

  async findActiveById(id: number): Promise<Folder | null> {
    return this.delegate.findFirst({
      where: { id, deleted: false },
    });
  }

  async findAllWithWordSetCount(args: {
    where: Prisma.FolderWhereInput;
    orderBy?:
      | Prisma.FolderOrderByWithRelationInput
      | Prisma.FolderOrderByWithRelationInput[];
    skip?: number;
    take?: number;
  }): Promise<FolderEntity[]> {
    return this.delegate.findMany({
      ...args,
      include: {
        _count: { select: { wordSets: true } },
      },
    });
  }
}
