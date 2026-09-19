import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { AppException } from '../../common/exceptions/app.exception';
import { VOCALEARN_ERROR_CODES } from '../../constants/error-code.constant';
import { ActorType } from '../../constants/actor-type.constant';
import {
  PaginatedResponse,
  PaginationMeta,
} from '../../common/responses/paginated.response';
import { toSlug } from '../../utils/slug.util';
import { WordSetService } from '../word-set/word-set.service';
import type { WordSetActor } from '../word-set/word-set.service';
import { WordRepository } from './repositories/word.repository';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';
import { QueryWordDto } from './dto/query-word.dto';
import { WordResponse } from './response/word.response';

@Injectable()
export class WordService {
  constructor(
    private readonly wordRepository: WordRepository,
    private readonly wordSetService: WordSetService,
  ) {}

  private buildWhereClause(query: QueryWordDto): Prisma.WordWhereInput {
    const where: Prisma.WordWhereInput = {
      deleted: false,
      wordSetId: query.wordSetId,
    };
    if (query.keyword) {
      where.OR = [
        { slug: { contains: toSlug(query.keyword) } },
        { meaning: { contains: query.keyword.trim() } },
      ];
    }
    return where;
  }

  private toActor(userId?: number): WordSetActor {
    return userId === undefined
      ? { type: ActorType.ADMIN }
      : { type: ActorType.USER, userId };
  }

  private async getWord(id: number) {
    const word = await this.wordRepository.findActiveById(id);
    if (!word) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.WORD.WORD_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return word;
  }

  async findAll(
    query: QueryWordDto,
    userId?: number,
  ): Promise<PaginatedResponse<WordResponse>> {
    await this.wordSetService.assertCanRead(
      query.wordSetId,
      this.toActor(userId),
    );
    const where = this.buildWhereClause(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const [totalRecord, words] = await Promise.all([
      this.wordRepository.count(where),
      this.wordRepository.findAll({
        where,
        orderBy: [{ id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    const totalPage = Math.ceil(totalRecord / limit);
    return new PaginatedResponse(
      words.map((word) => new WordResponse(word)),
      new PaginationMeta({ page, limit, totalRecord, totalPage }),
    );
  }

  async findOne(id: number, userId?: number): Promise<WordResponse> {
    const word = await this.getWord(id);
    await this.wordSetService.assertCanRead(
      word.wordSetId,
      this.toActor(userId),
    );
    return new WordResponse(word);
  }

  async create(dto: CreateWordDto, userId?: number): Promise<WordResponse[]> {
    await this.wordSetService.assertCanWrite(
      dto.wordSetId,
      this.toActor(userId),
    );
    const words = dto.words.map((word) => ({
      ...word,
      slug: toSlug(word.term),
      wordSetId: dto.wordSetId,
    }));
    const created = await this.wordRepository.createWords(dto.wordSetId, words);
    return created.map((word) => new WordResponse(word));
  }

  async update(
    id: number,
    dto: UpdateWordDto,
    userId?: number,
  ): Promise<WordResponse> {
    const word = await this.getWord(id);
    await this.wordSetService.assertCanWrite(
      word.wordSetId,
      this.toActor(userId),
    );
    const data: Prisma.WordUpdateInput = { ...dto };
    if (dto.term !== undefined) data.slug = toSlug(dto.term);
    const updated = await this.wordRepository.updateActive(id, data);
    return new WordResponse(updated);
  }

  async remove(id: number, userId?: number): Promise<boolean> {
    const word = await this.getWord(id);
    await this.wordSetService.assertCanWrite(
      word.wordSetId,
      this.toActor(userId),
    );
    return this.wordRepository.removeWord(id, word.wordSetId);
  }
}
