import { applyDecorators, SetMetadata } from '@nestjs/common';

import { PermissionOperator } from '../../constants/permission.constant';

export const PERMISSIONS_KEY = 'permissions';
export const PERMISSIONS_PARAMS_KEY = 'permissions_operator';

export const RequirePermissions = (
  permissions: string[],
  operator: PermissionOperator = PermissionOperator.AND,
) => {
  return applyDecorators(
    SetMetadata(PERMISSIONS_KEY, permissions),
    SetMetadata(PERMISSIONS_PARAMS_KEY, operator),
  );
};
