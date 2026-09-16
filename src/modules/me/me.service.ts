import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { UpdateProfileDto } from '../user/dto/update-user.dto';
import { UserResponse } from '../user/responses/user.response';
import { Prisma } from '../../generated/prisma/client';
import {
  PaginatedResponse,
  PaginationMeta,
} from '../../common/responses/paginated.response';
import { toSlug } from '../../utils/slug.util';
import { FolderRepository } from '../folder/repositories/folder.repository';
import { FolderResponse } from '../folder/responses/folder.response';
import { WordSetRepository } from '../word-set/repositories/word-set.repository';
import {
  INCLUDE,
  WordSetResponse,
} from '../word-set/responses/word-set.response';
import { QueryLibraryDto } from './dto/query-library.dto';
import { LibraryResponse } from './responses/library.response';

@Injectable()
export class MeService {
  constructor(
    private readonly userService: UserService,
    private readonly folderRepository: FolderRepository,
    private readonly wordSetRepository: WordSetRepository,
  ) {}

  async getLibrary(
    userId: number,
    query: QueryLibraryDto,
  ): Promise<PaginatedResponse<LibraryResponse>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const folderWhere: Prisma.FolderWhereInput = {
      creatorId: userId,
      deleted: false,
    };
    const wordSetWhere: Prisma.WordSetWhereInput = {
      creatorId: userId,
      deleted: false,
      folderId: null,
      learningPathId: null,
    };

    if (query.keyword) {
      folderWhere.slug = { contains: toSlug(query.keyword) };
      wordSetWhere.slug = { contains: toSlug(query.keyword) };
    }
    const [folderCount, wordSetCount] = await Promise.all([
      this.folderRepository.count(folderWhere),
      this.wordSetRepository.count(wordSetWhere),
    ]);

    const items: LibraryResponse[] = [];

    // Lấy folder trước nếu trang hiện tại chưa vượt qua hết folder.
    if (skip < folderCount) {
      const folders = await this.folderRepository.findAllWithWordSetCount({
        where: folderWhere,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: Math.min(limit, folderCount - skip),
      });
      for (const folder of folders) {
        items.push(new LibraryResponse('folder', new FolderResponse(folder)));
      }
    }

    // Phần còn lại của trang dành cho word-set đứng riêng.
    const wordSetSkip = Math.max(0, skip - folderCount);
    if (items.length < limit && wordSetSkip < wordSetCount) {
      const wordSets = await this.wordSetRepository.findAll({
        where: wordSetWhere,
        include: INCLUDE,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: wordSetSkip,
        take: limit - items.length,
      });
      for (const wordSet of wordSets) {
        items.push(
          new LibraryResponse('word-set', new WordSetResponse(wordSet)),
        );
      }
    }

    const totalRecord = folderCount + wordSetCount;
    return new PaginatedResponse(
      items,
      new PaginationMeta({
        page,
        limit,
        totalRecord,
        totalPage: Math.ceil(totalRecord / limit),
      }),
    );
  }

  getProfile(userId: number): Promise<UserResponse> {
    return this.userService.getProfile(userId);
  }

  updateProfile(userId: number, dto: UpdateProfileDto): Promise<UserResponse> {
    return this.userService.updateProfile(userId, dto);
  }

  updateAvatar(
    userId: number,
    file: Express.Multer.File,
  ): Promise<UserResponse> {
    return this.userService.updateAvatar(userId, file);
  }
}
