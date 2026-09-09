import { HttpStatus, Injectable } from '@nestjs/common';
import { LearningPathRepository } from './repositories/learning-path.repository';
import { CategoryRepository } from '../category/repositories/category.repository';
import { CreateLearningPathDto } from './dto/create-learning-path.dto';
import { UpdateLearningPathDto } from './dto/update-learning-path.dto';
import { QueryLearningPathDto } from './dto/query-learning-path.dto';
import { Prisma } from '../../generated/prisma/client';
import { generateUniqueSlug, toSlug } from '../../utils/slug.util';
import {
  PaginatedResponse,
  PaginationMeta,
} from '../../common/responses/paginated.response';
import { AppException } from '../../common/exceptions/app.exception';
import { VOCALEARN_ERROR_CODES } from '../../constants/error-code.constant';
import { LearningPathResponse } from './response/learning-path.response';

@Injectable()
export class LearningPathService {
  constructor(
    private readonly learningPathRepository: LearningPathRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  private buildWhereClause(
    query: QueryLearningPathDto,
  ): Prisma.LearningPathWhereInput {
    const where: Prisma.LearningPathWhereInput = { deleted: false };

    if (query.keyword) {
      where.slug = { contains: toSlug(query.keyword) };
    }

    if (query.categoryId !== undefined) {
      where.categoryId = query.categoryId;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    return where;
  }

  private async assertCategoryExists(categoryId: number) {
    const category = await this.categoryRepository.findActiveById(categoryId);
    if (!category) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.CATEGORY.CATEGORY_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async findAll(
    query: QueryLearningPathDto,
    forceActiveOnly = false,
  ): Promise<PaginatedResponse<LearningPathResponse>> {
    const where = this.buildWhereClause(query);
    if (forceActiveOnly) where.isActive = true;

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [totalRecord, learningPaths] = await Promise.all([
      this.learningPathRepository.count(where),
      this.learningPathRepository.findAll({
        where,
        orderBy: [{ order: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPage = Math.ceil(totalRecord / limit);
    return new PaginatedResponse(
      learningPaths.map((lp) => new LearningPathResponse(lp)),
      new PaginationMeta({ page, limit, totalRecord, totalPage }),
    );
  }

  async findOne(
    id: number,
    forceActiveOnly = false,
  ): Promise<LearningPathResponse> {
    const learningPath = await this.learningPathRepository.findActiveById(id);

    if (!learningPath || (forceActiveOnly && !learningPath.isActive)) {
      // điều kiện là forceActiveOnly = true và learningPath.isActive = false thì cũng throw lỗi: ví dụ:
      // học viên đang học learning path nhưng learning path đó bị admin tắt đi thì học viên không được xem nữa
      throw new AppException(
        VOCALEARN_ERROR_CODES.LEARNING_PATH.LEARNING_PATH_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return new LearningPathResponse(learningPath);
  }

  async create(dto: CreateLearningPathDto): Promise<LearningPathResponse> {
    await this.assertCategoryExists(dto.categoryId);

    const duplicated = await this.learningPathRepository.findBySlugOrNameExists(
      dto.name,
      dto.categoryId,
    );
    if (duplicated) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.LEARNING_PATH.LEARNING_PATH_DUPLICATED,
        HttpStatus.BAD_REQUEST,
      );
    }

    const slug = await generateUniqueSlug(
      (s) => this.learningPathRepository.findBySlug(s).then((c) => !!c),
      dto.name,
    );

    const order = await this.learningPathRepository.count({
      deleted: false,
      categoryId: dto.categoryId,
    });

    const created = await this.learningPathRepository.create({
      ...dto,
      slug,
      order: order + 1,
    });
    return new LearningPathResponse(created);
  }

  async update(
    id: number,
    dto: UpdateLearningPathDto,
  ): Promise<LearningPathResponse> {
    const learningPath = await this.learningPathRepository.findActiveById(id);
    if (!learningPath) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.LEARNING_PATH.LEARNING_PATH_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    if (dto.categoryId !== undefined) {
      await this.assertCategoryExists(dto.categoryId);
    }

    const updated = await this.learningPathRepository.update(id, dto);
    if (!updated) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.LEARNING_PATH.LEARNING_PATH_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return new LearningPathResponse(updated);
  }

  async remove(id: number): Promise<boolean> {
    const learningPath = await this.learningPathRepository.findActiveById(id);
    if (!learningPath) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.LEARNING_PATH.LEARNING_PATH_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.learningPathRepository.deleteById(id);
    return true;
  }
}
