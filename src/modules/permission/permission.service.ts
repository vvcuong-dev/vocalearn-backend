// src/modules/permission/permission.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PermissionOperator } from '../../constants/permission.constant';
import { PermissionResponse } from './responses/permission.response';

@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaService) {}

  /** Lấy danh sách code permission của 1 role */
  async getRolePermissionCodes(roleId: number): Promise<string[]> {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });
    return rolePermissions.map((rp) => rp.permission.code);
  }

  async findAll(): Promise<PermissionResponse[]> {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ group: 'asc' }, { name: 'asc' }],
    });
    return permissions.map((p) => new PermissionResponse(p));
  }

  async verify(
    roleId: number | null | undefined,
    requiredCodes: string[],
    operator: PermissionOperator = PermissionOperator.AND,
  ): Promise<boolean> {
    if (!requiredCodes.length) return true;
    if (!roleId) return false;

    const userCodes = await this.getRolePermissionCodes(roleId);
    const userCodeSet = new Set(userCodes);

    if (operator === PermissionOperator.OR) {
      return requiredCodes.some((code) => userCodeSet.has(code));
    }
    return requiredCodes.every((code) => userCodeSet.has(code));
  }
}
