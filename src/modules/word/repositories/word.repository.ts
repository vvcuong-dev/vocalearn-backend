import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, Word } from '../../../generated/prisma/client';

@Injectable()
export class WordRepository extends BaseRepository<Word, number> {
  constructor(prisma: PrismaService) {
    super('Word', prisma);
  }

  findActiveById(id: number): Promise<Word | null> {
    return this.prisma.word.findFirst({ where: { id, deleted: false } });
  }

  createWords(
    wordSetId: number,
    words: Prisma.WordCreateManyInput[],
  ): Promise<Word[]> {
    return this.prisma.$transaction(async (tx) => {
      // Cập nhật số đếm và thêm từ cùng transaction: lỗi thì hoàn tác cả hai.
      await tx.wordSet.update({
        where: { id: wordSetId, deleted: false },
        data: { wordCount: { increment: words.length } },
      });
      const created: Word[] = [];
      for (const word of words) {
        created.push(await tx.word.create({ data: word }));
      }
      return created;
    });
  }

  updateActive(id: number, data: Prisma.WordUpdateInput): Promise<Word> {
    return this.prisma.word.update({ where: { id, deleted: false }, data });
  }

  removeWord(id: number, wordSetId: number): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.word.updateMany({
        where: { id, wordSetId, deleted: false },
        data: { deleted: true, deletedAt: new Date() },
      });
      // Chỉ giảm số đếm khi thực sự xóa, kể cả khi hai request đến cùng lúc.
      if (result.count === 0) return false;
      await tx.wordSet.update({
        where: { id: wordSetId },
        data: { wordCount: { decrement: 1 } },
      });
      return true;
    });
  }
}
