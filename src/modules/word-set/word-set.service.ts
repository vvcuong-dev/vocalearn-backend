import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { AppException } from '../../common/exceptions/app.exception';
import {
  PaginatedResponse,
  PaginationMeta,
} from '../../common/responses/paginated.response';
import { VOCALEARN_ERROR_CODES } from '../../constants/error-code.constant';
import { CreateAdminWordSetDto } from './dto/create-admin-word-set.dto';
import { CreateUserWordSetDto } from './dto/create-user-word-set.dto';
import { UpdateWordSetDto } from './dto/update-word-set.dto';
import { QueryWordSetDto } from './dto/query-word-set.dto';
import { WordSetRepository } from './repositories/word-set.repository';
import { WordSetResponse, INCLUDE } from './responses/word-set.response';
import { LearningPathRepository } from '../learning-path/repositories/learning-path.repository';
import { ActorType } from '../../constants/actor-type.constant';
import { generateUniqueSlug, toSlug } from '../../utils/slug.util';
import { UpdateUserWordSetDto } from './dto/update-user-word-set.dto';

type WordSetActor =
  { type: ActorType.ADMIN } | { type: ActorType.USER; userId: number };

@Injectable()
export class WordSetService {
  constructor(
    private readonly wordSetRepository: WordSetRepository,
    private readonly learningPathRepository: LearningPathRepository,
  ) {}

  private buildWhereClause(
    query: QueryWordSetDto,
    actor: WordSetActor,
  ): Prisma.WordSetWhereInput {
    const where: Prisma.WordSetWhereInput = { deleted: false };

    if (query.keyword) {
      where.slug = { contains: toSlug(query.keyword) };
    }
    if (query.learningPathId !== undefined)
      where.learningPathId = query.learningPathId;
    if (query.folderId !== undefined) where.folderId = query.folderId;
    if (query.isPro !== undefined) where.isPro = query.isPro;

    // User chỉ xem: set của mình, set trong folder công khai, hoặc set chính thức thuộc lộ trình đang hoạt động
    if (actor.type === ActorType.USER) {
      where.OR = [
        { creatorId: actor.userId },
        {
          folder: {
            is: { deleted: false, isPublic: true, isHiddenByAdmin: false },
          },
        },
        {
          creatorId: null,
          learningPath: { is: { deleted: false, isActive: true } },
        },
      ];
    }

    return where;
  }

  private async assertLearningPathExists(id: number) {
    const learningPath = await this.learningPathRepository.findActiveById(id);
    if (!learningPath) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.LEARNING_PATH.LEARNING_PATH_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async findAll(
    query: QueryWordSetDto,
    actor: WordSetActor,
  ): Promise<PaginatedResponse<WordSetResponse>> {
    const where = this.buildWhereClause(query, actor);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [totalRecord, wordSets] = await Promise.all([
      this.wordSetRepository.count(where),
      this.wordSetRepository.findAll({
        where,
        include: INCLUDE,
        orderBy: [{ order: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPage = Math.ceil(totalRecord / limit);
    return new PaginatedResponse(
      wordSets.map((ws) => new WordSetResponse(ws)),
      new PaginationMeta({ page, limit, totalRecord, totalPage }),
    );
  }

  async findOne(id: number, actor: WordSetActor): Promise<WordSetResponse> {
    const where = this.buildWhereClause({}, actor);
    where.id = id;

    const wordSet = await this.wordSetRepository.findFirstByWhere(where);
    if (!wordSet) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.WORD_SET.WORD_SET_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return new WordSetResponse(wordSet);
  }

  async create(dto: CreateAdminWordSetDto): Promise<WordSetResponse> {
    await this.assertLearningPathExists(dto.learningPathId);

    const order = await this.wordSetRepository.count({
      deleted: false,
      learningPathId: dto.learningPathId,
    });

    const slug = await generateUniqueSlug(
      (s) => this.learningPathRepository.findBySlug(s).then((c) => !!c),
      dto.name,
    );

    const created = await this.wordSetRepository.create({
      ...dto,
      order: order + 1,
      slug,
      creatorId: null,
    });
    return this.findOne(created.id, { type: ActorType.ADMIN });
  }

  async update(id: number, dto: UpdateWordSetDto): Promise<WordSetResponse> {
    const wordSet = await this.wordSetRepository.findActiveById(id);
    if (!wordSet) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.WORD_SET.WORD_SET_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    if (wordSet.creatorId !== null) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.AUTH.PERMISSION_DENIED,
        HttpStatus.FORBIDDEN,
      );
    }

    const updated = await this.wordSetRepository.update(id, dto);
    if (!updated) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.WORD_SET.WORD_SET_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.findOne(id, { type: ActorType.ADMIN });
  }

  async createOwn(
    userId: number,
    dto: CreateUserWordSetDto,
  ): Promise<WordSetResponse> {
    const order = await this.wordSetRepository.count({
      deleted: false,
      creatorId: userId,
      folderId: dto.folderId ?? null,
    });

    const slug = await generateUniqueSlug(
      (s) =>
        this.wordSetRepository.findFirstByWhere({ slug: s }).then((c) => !!c),
      dto.name,
    );

    const created = await this.wordSetRepository.create({
      ...dto,
      order: order + 1,
      slug,
      creatorId: userId,
      learningPathId: null,
    });
    return this.findOne(created.id, { type: ActorType.USER, userId });
  }

  async updateOwn(
    userId: number,
    id: number,
    dto: UpdateUserWordSetDto,
  ): Promise<WordSetResponse> {
    const wordSet = await this.wordSetRepository.findActiveById(id);
    if (!wordSet) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.WORD_SET.WORD_SET_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    if (wordSet.creatorId !== userId) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.AUTH.PERMISSION_DENIED,
        HttpStatus.FORBIDDEN,
      );
    }

    const updated = await this.wordSetRepository.update(id, dto);
    if (!updated) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.WORD_SET.WORD_SET_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.findOne(id, { type: ActorType.USER, userId });
  }

  async remove(id: number, actor: WordSetActor): Promise<boolean> {
    const wordSet = await this.wordSetRepository.findActiveById(id);
    if (!wordSet) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.WORD_SET.WORD_SET_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    if (actor.type === ActorType.USER && wordSet.creatorId !== actor.userId) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.AUTH.PERMISSION_DENIED,
        HttpStatus.FORBIDDEN,
      );
    }

    if (await this.wordSetRepository.hasActiveWords(id)) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.WORD_SET.WORD_SET_HAS_WORDS,
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.wordSetRepository.deleteById(id);
    return true;
  }
}
