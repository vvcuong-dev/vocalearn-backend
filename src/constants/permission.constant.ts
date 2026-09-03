export const PERMISSIONS = {
  USER: {
    LIST: 'USER_LIST',
    CREATE: 'USER_CREATE',
    UPDATE: 'USER_UPDATE',
    DELETE: 'USER_DELETE',
  },
  ROLE: {
    LIST: 'ROLE_LIST',
    CREATE: 'ROLE_CREATE',
    UPDATE: 'ROLE_UPDATE',
    DELETE: 'ROLE_DELETE',
    ASSIGN_PERMISSION: 'ROLE_ASSIGN_PERMISSION',
  },
} as const;

export enum PermissionOperator {
  AND = 'AND',
  OR = 'OR',
}
