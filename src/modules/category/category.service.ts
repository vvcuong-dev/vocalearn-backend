import { HttpStatus, Injectable } from '@nestjs/common';
import { CategoryRepository } from './repositories/category.repository';
import { QueryCategoryDto } from './dto/query-category.dto';
import { Prisma } from '../../generated/prisma/client';
import { generateUniqueSlug, toSlug } from '../../utils/slug.util';
import {
  PaginatedResponse,
  PaginationMeta,
} from '../../common/responses/paginated.response';
import { CategoryResponse } from './responses/category.response';
import { AppException } from '../../common/exceptions/app.exception';
import { VOCALEARN_ERROR_CODES } from '../../constants/error-code.constant';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  private buildWhereClause(query: QueryCategoryDto): Prisma.CategoryWhereInput {
    const where: Prisma.CategoryWhereInput = { deleted: false };

    if (query.keyword) {
      where.slug = { contains: toSlug(query.keyword) };
    }
    return where;
  }

  async findAll(
    query: QueryCategoryDto,
  ): Promise<PaginatedResponse<CategoryResponse>> {
    const where = this.buildWhereClause(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [totalRecord, categories] = await Promise.all([
      this.categoryRepository.count(where),
      this.categoryRepository.findAll({
        where,
        orderBy: [{ order: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPage = Math.ceil(totalRecord / limit);
    return new PaginatedResponse(
      categories.map((category) => new CategoryResponse(category)),
      new PaginationMeta({ page, limit, totalRecord, totalPage }),
    );
  }

  async findOne(id: number): Promise<CategoryResponse> {
    const category = await this.categoryRepository.findActiveById(id);
    if (!category) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.CATEGORY.CATEGORY_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return new CategoryResponse(category);
  }

  async create(dto: CreateCategoryDto): Promise<CategoryResponse> {
    const slug = await generateUniqueSlug(
      (s) => this.categoryRepository.findBySlug(s).then((c) => !!c),
      dto.name,
    );

    const order =
      dto.order ?? (await this.categoryRepository.count({ deleted: false }));

    const category = await this.categoryRepository.create({
      name: dto.name,
      slug,
      order,
    });

    return new CategoryResponse(category);
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<CategoryResponse> {
    const category = await this.categoryRepository.findActiveById(id);

    if (!category) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.CATEGORY.CATEGORY_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    let slug: string | undefined;
    if (dto.name && dto.name !== category.name) {
      slug = await generateUniqueSlug(
        (s) => this.categoryRepository.findBySlug(s, id).then((c) => !!c),
        dto.name,
      );
    }

    const updated = await this.categoryRepository.update(id, {
      ...dto,
      ...(slug ? { slug } : {}),
    });

    if (!updated) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.CATEGORY.CATEGORY_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return new CategoryResponse(updated);
  }

  async remove(id: number): Promise<boolean> {
    const category = await this.categoryRepository.findActiveById(id);
    if (!category) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.CATEGORY.CATEGORY_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    await this.categoryRepository.deleteById(id);
    return true;
  }
}
