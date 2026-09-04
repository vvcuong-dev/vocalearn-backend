import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_KEY,
  PERMISSIONS_PARAMS_KEY,
} from '../decorators/require-permissions.decorator';
import { PermissionOperator } from '../../constants/permission.constant';
import { PermissionService } from '../../modules/permission/permission.service';
import { AppException } from '../exceptions/app.exception';
import { VOCALEARN_ERROR_CODES } from '../../constants/error-code.constant';
import { HttpStatus } from '@nestjs/common';
import type { RequestWithUser } from '../types/request-with-user.type';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const operator =
      this.reflector.getAllAndOverride<PermissionOperator>(
        PERMISSIONS_PARAMS_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? PermissionOperator.AND;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.AUTH.INVALID_ACCESS_TOKEN,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const verified = await this.permissionService.verify(
      user.roleId,
      requiredPermissions,
      operator,
    ); // kiểm tra quyền của user dựa trên roleId và danh sách permission yêu cầu

    if (!verified) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.AUTH.PERMISSION_DENIED,
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}
