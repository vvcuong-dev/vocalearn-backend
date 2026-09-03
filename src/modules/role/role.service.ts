import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../../common/exceptions/app.exception';
import { VOCALEARN_ERROR_CODES } from '../../constants/error-code.constant';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { PermissionService } from '../permission/permission.service';
import { Prisma } from '../../generated/prisma/browser'; // đổi path cho khớp project bạn
import {
  PaginatedResponse,
  PaginationMeta,
} from '../../common/responses/paginated.response';
import { RoleListResponse } from './responses/role-list.response';

@Injectable()
export class RoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionService: PermissionService,
  ) {}

  async create(dto: CreateRoleDto) {
    const existed = await this.prisma.role.findUnique({
      where: { code: dto.code },
    });
    if (existed) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.ROLE.ROLE_ALREADY_EXISTS,
        HttpStatus.CONFLICT,
      );
    }
    return this.prisma.role.create({ data: dto });
  }

  private buildWhereClause(query: QueryRoleDto): Prisma.RoleWhereInput {
    const where: Prisma.RoleWhereInput = { deleted: false };

    if (typeof query.isActive === 'boolean') {
      where.isActive = query.isActive;
    }

    if (query.keyword) {
      where.OR = [
        { name: { contains: query.keyword } },
        { code: { contains: query.keyword } },
      ];
    }

    return where;
  }

  async findAll(
    query: QueryRoleDto,
  ): Promise<PaginatedResponse<RoleListResponse>> {
    const where = this.buildWhereClause(query);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [totalRecord, roles] = await Promise.all([
      this.prisma.role.count({ where }),
      this.prisma.role.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPage = Math.ceil(totalRecord / limit);
    return new PaginatedResponse(
      roles.map((r) => new RoleListResponse(r)),
      new PaginationMeta({ page, limit, totalRecord, totalPage }),
    );
  }

  async findById(id: number) {
    const role = await this.prisma.role.findFirst({
      where: { id, deleted: false },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.ROLE.ROLE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return role;
  }

  async update(id: number, dto: UpdateRoleDto) {
    const role = await this.findById(id);
    if (role.isSystem) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.ROLE.CANNOT_MODIFY_SYSTEM_ROLE,
        HttpStatus.FORBIDDEN,
      );
    }
    return this.prisma.role.update({ where: { id }, data: dto });
  }

  async delete(id: number) {
    const role = await this.findById(id);
    if (role.isSystem) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.ROLE.CANNOT_MODIFY_SYSTEM_ROLE,
        HttpStatus.FORBIDDEN,
      );
    }
    await this.prisma.role.update({
      where: { id },
      data: { deleted: true, isActive: false },
    });
    return true;
  }

  async assignPermissions(roleId: number, dto: AssignPermissionsDto) {
    await this.findById(roleId); // throw nếu không tồn tại

    const permissions = await this.prisma.permission.findMany({
      where: { code: { in: dto.permissionCodes } },
    });
    if (permissions.length !== dto.permissionCodes.length) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.PERMISSION.PERMISSION_NOT_FOUND,
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      this.prisma.rolePermission.createMany({
        data: permissions.map((p) => ({ roleId, permissionId: p.id })),
      }),
    ]);

    return this.findById(roleId);
  }
}
