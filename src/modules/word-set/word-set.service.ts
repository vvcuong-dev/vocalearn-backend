import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, WordSet } from '../../generated/prisma/client';
import { plainToInstance } from 'class-transformer';
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
import { WordSetResponse } from './responses/word-set.response';
import { LearningPathRepository } from '../learning-path/repositories/learning-path.repository';
import { ActorType } from '../../constants/actor-type.constant';

type WordSetActor =
  { type: ActorType.ADMIN } | { type: ActorType.USER; userId: number };

const INCLUDE = {
  learningPath: { select: { id: true, name: true } },
  creator: { select: { id: true, name: true } },
  folder: { select: { id: true, name: true } },
} satisfies Prisma.WordSetInclude;

type WordSetEntity = WordSet &
  Partial<Prisma.WordSetGetPayload<{ include: typeof INCLUDE }>>;

@Injectable()
export class WordSetService {
  constructor(
    private readonly wordSetRepository: WordSetRepository,
    private readonly learningPathRepository: LearningPathRepository,
  ) {}

  private buildWhereClause(query: QueryWordSetDto): Prisma.WordSetWhereInput {
    const where: Prisma.WordSetWhereInput = { deleted: false };
    if (query.keyword) where.name = { contains: query.keyword };
    if (query.learningPathId !== undefined)
      where.learningPathId = query.learningPathId;
    if (query.folderId !== undefined) where.folderId = query.folderId;
    if (query.isPro !== undefined) where.isPro = query.isPro;
    return where;
  }

  private async assertLearningPathExists(id: number) {
    if (!(await this.learningPathRepository.findActiveById(id))) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.LEARNING_PATH.LEARNING_PATH_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  private notFound(): never {
    throw new AppException(
      VOCALEARN_ERROR_CODES.WORD_SET.WORD_SET_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
  }

  private async findRawOrThrow(id: number): Promise<WordSetEntity> {
    const set = await this.wordSetRepository.findById(id, { include: INCLUDE });
    if (!set || set.deleted) this.notFound();
    return set;
  }

  // Tìm order tiếp theo khi tạo mới 1 word set
  private async nextOrder(where: Prisma.WordSetWhereInput): Promise<number> {
    const [last] = await this.wordSetRepository.findAll({
      where: { ...where, deleted: false },
      orderBy: { order: 'desc' },
      take: 1,
    });
    return (last?.order ?? 0) + 1;
  }

  private toResponse(entity: WordSetEntity): WordSetResponse {
    return plainToInstance(
      WordSetResponse,
      {
        ...entity,
        creator: entity.creator
          ? { id: entity.creator.id, fullName: entity.creator.name }
          : null,
      },
      { excludeExtraneousValues: true },
    );
  }

  private assertOwner(creatorId: number | null, userId: number) {
    if (creatorId !== userId) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.AUTH.PERMISSION_DENIED,
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private async updateAndRespond(
    id: number,
    data: Prisma.WordSetUncheckedUpdateInput,
    actor: WordSetActor,
  ): Promise<WordSetResponse> {
    const updated = await this.wordSetRepository.update(id, data);
    if (!updated) this.notFound();
    return this.findOne(id, actor);
  }

  // Tạo word set chính thức, chỉ admin mới có quyền gọi
  async create(dto: CreateAdminWordSetDto): Promise<WordSetResponse> {
    await this.assertLearningPathExists(dto.learningPathId);
    const order =
      dto.order ??
      (await this.nextOrder({
        learningPathId: dto.learningPathId,
      }));
    const created = await this.wordSetRepository.create({
      ...dto,
      order,
      isPublic: dto.isPublic ?? true,
      creatorId: null,
    });
    return this.findOne(created.id, { type: ActorType.ADMIN });
  }

  // Cập nhật word set chính thức, chỉ admin mới có quyền gọi
  async update(id: number, dto: UpdateWordSetDto): Promise<WordSetResponse> {
    const set = await this.findRawOrThrow(id);
    if (set.creatorId !== null) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.AUTH.PERMISSION_DENIED,
        HttpStatus.FORBIDDEN,
      );
    }
    return this.updateAndRespond(id, dto, { type: ActorType.ADMIN });
  }

  // Tạo word set của user, chỉ user mới có quyền gọi
  async createOwn(
    userId: number,
    dto: CreateUserWordSetDto,
  ): Promise<WordSetResponse> {
    const order =
      dto.order ??
      (await this.nextOrder({
        creatorId: userId,
        folderId: dto.folderId ?? null,
      }));
    const created = await this.wordSetRepository.create({
      ...dto,
      order,
      creatorId: userId,
      learningPathId: null,
    });
    return this.findOne(created.id, { type: ActorType.USER, userId });
  }

  // Cập nhật word set của chính user đó
  async updateOwn(
    userId: number,
    id: number,
    dto: UpdateWordSetDto,
  ): Promise<WordSetResponse> {
    const set = await this.findRawOrThrow(id);
    this.assertOwner(set.creatorId, userId);
    const { name, description, order, isPublic } = dto;
    return this.updateAndRespond(
      id,
      { name, description, order, isPublic },
      { type: ActorType.USER, userId },
    );
  }

  // Hiển thị danh sách word set: admin xem tất cả, user chỉ xem word set của mình và word set public
  async findAll(
    query: QueryWordSetDto,
    actor: WordSetActor,
  ): Promise<PaginatedResponse<WordSetResponse>> {
    const where = this.buildWhereClause(query);
    if (actor.type === ActorType.USER) {
      where.OR = [
        { isPublic: true, isHiddenByAdmin: false },
        { creatorId: actor.userId },
      ];
    }
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const [totalRecord, items] = await Promise.all([
      this.wordSetRepository.count(where),
      this.wordSetRepository.findAll({
        where,
        include: INCLUDE,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ order: 'asc' }, { id: 'asc' }],
      }),
    ]);
    return new PaginatedResponse(
      items.map((item) => this.toResponse(item)),
      new PaginationMeta({
        page,
        limit,
        totalRecord,
        totalPage: Math.ceil(totalRecord / limit),
      }),
    );
  }

  async findOne(id: number, actor: WordSetActor): Promise<WordSetResponse> {
    const set = await this.findRawOrThrow(id);
    if (
      actor.type === ActorType.USER &&
      !(
        (set.isPublic && !set.isHiddenByAdmin) ||
        set.creatorId === actor.userId
      )
    )
      this.notFound();
    return this.toResponse(set);
  }

  async remove(id: number, actor: WordSetActor): Promise<boolean> {
    const set = await this.findRawOrThrow(id);
    if (actor.type === ActorType.USER)
      this.assertOwner(set.creatorId, actor.userId);
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
