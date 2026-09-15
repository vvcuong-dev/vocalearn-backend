import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, WordSet } from '../../../generated/prisma/client';
import { INCLUDE, WordSetEntity } from '../responses/word-set.response';

@Injectable()
export class WordSetRepository extends BaseRepository<WordSet, number> {
  constructor(prisma: PrismaService) {
    super('WordSet', prisma);
  }

  async findFirstByWhere(
    where: Prisma.WordSetWhereInput,
  ): Promise<WordSetEntity | null> {
    return this.delegate.findFirst({
      where,
      include: INCLUDE,
    });
  }

  async findActiveById(
    id: number,
    options?: { include?: Prisma.WordSetInclude },
  ): Promise<WordSetEntity | null> {
    return this.delegate.findFirst({
      where: { id, deleted: false },
      ...(options?.include ? { include: options.include } : {}),
    });
  }

  async hasActiveWords(wordSetId: number): Promise<boolean> {
    const count = await this.prisma.word.count({
      where: {
        wordSetId,
        deleted: false,
      },
    });

    return count > 0;
  }

  async incrementWordCount(wordSetId: number, delta: number): Promise<WordSet> {
    return await this.delegate.update({
      where: {
        id: wordSetId,
      },
      data: {
        wordCount: {
          increment: delta,
        },
      },
    });
  }
}
