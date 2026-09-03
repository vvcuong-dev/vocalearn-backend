import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-user.dto';
import { VOCALEARN_ERROR_CODES } from '../../constants/error-code.constant';
import { AppException } from '../../common/exceptions/app.exception';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CLOUDINARY_FOLDERS } from '../../constants/cloudinary.constant';
import { Logger } from '@nestjs/common';
import { User, UserStatus, Prisma } from '../../generated/prisma/browser';
import { UserResponse } from './responses/user.response';
import { QueryUserDto } from './dto/query-user.dto';
import {
  PaginatedResponse,
  PaginationMeta,
} from '../../common/responses/paginated.response';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { hashPassword } from '../../utils/password.util';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async findById(id: number): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return user;
  }

  private buildWhereClause(query: QueryUserDto): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = { deleted: false };

    if (query.status) where.status = query.status;
    if (query.keyword) {
      where.OR = [
        { name: { contains: query.keyword } },
        { email: { contains: query.keyword } },
        { phone: { contains: query.keyword } },
      ];
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    return where;
  }

  async findAll(query: QueryUserDto): Promise<PaginatedResponse<UserResponse>> {
    const where = this.buildWhereClause(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [totalRecord, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPage = Math.ceil(totalRecord / limit);

    return new PaginatedResponse(
      users.map((user) => new UserResponse(user)),
      new PaginationMeta({ page, limit, totalRecord, totalPage }),
    );
  }

  async findOne(id: number): Promise<UserResponse> {
    const user = await this.prisma.user.findFirst({
      where: { id, deleted: false },
    });

    if (!user) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.USER.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return new UserResponse(user);
  }

  async create(dto: {
    name: string;
    email: string;
    password: string;
    status?: UserStatus;
    avatar?: string;
    phone?: string;
  }): Promise<UserResponse> {
    const existed = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existed) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.USER.EMAIL_ALREADY_EXISTS,
        HttpStatus.CONFLICT,
      );
    }

    const created = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: await hashPassword(dto.password),
        status: dto.status ?? UserStatus.ACTIVE,
        avatar: dto.avatar,
        phone: dto.phone,
      },
    });

    return new UserResponse(created);
  }

  async update(id: number, dto: AdminUpdateUserDto): Promise<UserResponse> {
    const user = await this.prisma.user.findFirst({
      where: { id, deleted: false },
    });

    if (!user) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.USER.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    if (dto.email && dto.email !== user.email) {
      const existed = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existed) {
        throw new AppException(
          VOCALEARN_ERROR_CODES.USER.EMAIL_ALREADY_EXISTS,
          HttpStatus.CONFLICT,
        );
      }
    }

    const { password, ...rest } = dto;
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...rest,
        ...(password ? { password: await hashPassword(password) } : {}),
      },
    });

    return new UserResponse(updated);
  }

  async remove(id: number): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: { id, deleted: false },
    });

    if (!user) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.USER.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.prisma.user.update({
      where: { id },
      data: { deleted: true },
    });

    return true;
  }

  async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.USER.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });

    return new UserResponse(updatedUser);
  }

  async assignRole(id: number, roleId: number): Promise<UserResponse> {
    const user = await this.prisma.user.findFirst({
      where: { id, deleted: false },
    });

    if (!user) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.USER.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const role = await this.prisma.role.findFirst({
      where: { id: roleId, deleted: false },
    });

    if (!role) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.ROLE.ROLE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { roleId },
    });

    return new UserResponse(updated);
  }

  async updateAvatar(
    userId: number,
    file: Express.Multer.File,
  ): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.USER.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const uploaded = await this.cloudinaryService.uploadImage(
      file,
      CLOUDINARY_FOLDERS.AVATARS,
    );

    const upload = await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatar: uploaded.secure_url,
        avatarPublicId: uploaded.public_id,
      },
    });

    if (user.avatarPublicId) {
      await this.cloudinaryService
        .deleteImage(user.avatarPublicId)
        .catch((error: Error) => {
          this.logger.error(`Failed to delete old avatar: ${error.message}`);
        });
    }

    return new UserResponse(upload);
  }
}
