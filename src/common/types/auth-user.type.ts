import { UserStatus } from '../../generated/prisma/enums';

export interface AuthUser {
  id: number;
  email: string;
  status: UserStatus;
  roleId: number | null;
}
