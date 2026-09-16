import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { AppException } from '../../common/exceptions/app.exception';
import {
  PaginatedResponse,
  PaginationMeta,
} from '../../common/responses/paginated.response';
import { VOCALEARN_ERROR_CODES } from '../../constants/error-code.constant';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { QueryFolderDto } from './dto/query-folder.dto';
import { FolderRepository } from './repositories/folder.repository';
import { FolderResponse } from './responses/folder.response';
import { ActorType } from '../../constants/actor-type.constant';
import { generateUniqueSlug, toSlug } from '../../utils/slug.util';

type FolderActor =
  { type: ActorType.ADMIN } | { type: ActorType.USER; userId: number };

@Injectable()
export class FolderService {
  constructor(private readonly folderRepository: FolderRepository) {}

  private buildWhereClause(query: QueryFolderDto): Prisma.FolderWhereInput {
    const where: Prisma.FolderWhereInput = { deleted: false };

    if (query.keyword) {
      where.slug = { contains: toSlug(query.keyword) };
    }

    return where;
  }

  async findAll(
    query: QueryFolderDto,
  ): Promise<PaginatedResponse<FolderResponse>> {
    const where = this.buildWhereClause(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [totalRecord, folders] = await Promise.all([
      this.folderRepository.count(where),
      this.folderRepository.findAll({
        where,
        orderBy: [{ upvoteCount: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPage = Math.ceil(totalRecord / limit);
    return new PaginatedResponse(
      folders.map((f) => new FolderResponse(f)),
      new PaginationMeta({ page, limit, totalRecord, totalPage }),
    );
  }

  async findOne(id: number, actor: FolderActor): Promise<FolderResponse> {
    const where: Prisma.FolderWhereInput = { id, deleted: false };
    if (actor.type === ActorType.USER) {
      where.OR = [
        { creatorId: actor.userId },
        { isPublic: true, isHiddenByAdmin: false },
      ];
    }

    const folder = await this.folderRepository.findFirstByWhere(where);
    if (!folder) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.FOLDER.FOLDER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return new FolderResponse(folder);
  }

  async create(userId: number, dto: CreateFolderDto): Promise<FolderResponse> {
    const slug = await generateUniqueSlug(
      (s) => this.folderRepository.findBySlug(s).then((f) => !!f),
      dto.name,
    );

    const created = await this.folderRepository.create({
      name: dto.name,
      slug,
      creatorId: userId,
    });
    return new FolderResponse(created);
  }

  async update(
    userId: number,
    id: number,
    dto: UpdateFolderDto,
  ): Promise<FolderResponse> {
    const folder = await this.folderRepository.findActiveById(id);
    if (!folder) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.FOLDER.FOLDER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    if (folder.creatorId !== userId) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.AUTH.PERMISSION_DENIED,
        HttpStatus.FORBIDDEN,
      );
    }

    const slug = await generateUniqueSlug(
      (s) => this.folderRepository.findBySlug(s, id).then((f) => !!f),
      dto.name,
    );

    const updated = await this.folderRepository.update(id, {
      name: dto.name,
      slug,
    });
    if (!updated) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.FOLDER.FOLDER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return new FolderResponse(updated);
  }

  async updateVisibility(
    userId: number,
    id: number,
    isPublic: boolean,
  ): Promise<FolderResponse> {
    const folder = await this.folderRepository.findActiveById(id);
    if (!folder) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.FOLDER.FOLDER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    if (folder.creatorId !== userId) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.AUTH.PERMISSION_DENIED,
        HttpStatus.FORBIDDEN,
      );
    }

    const updated = await this.folderRepository.update(id, { isPublic });
    if (!updated) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.FOLDER.FOLDER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return new FolderResponse(updated);
  }

  async setHidden(
    id: number,
    isHiddenByAdmin: boolean,
  ): Promise<FolderResponse> {
    const folder = await this.folderRepository.findActiveById(id);
    if (!folder) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.FOLDER.FOLDER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const updated = await this.folderRepository.update(id, { isHiddenByAdmin });
    if (!updated) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.FOLDER.FOLDER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return new FolderResponse(updated);
  }

  async remove(userId: number, id: number): Promise<boolean> {
    const folder = await this.folderRepository.findActiveById(id);
    if (!folder) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.FOLDER.FOLDER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    if (folder.creatorId !== userId) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.AUTH.PERMISSION_DENIED,
        HttpStatus.FORBIDDEN,
      );
    }

    await this.folderRepository.deleteById(id);
    return true;
  }
}
