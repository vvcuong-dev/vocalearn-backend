import { ActorType } from '../../constants/actor-type.constant';
import { UserStatus } from '../../generated/prisma/enums';

export interface AuthUser {
  id: number;
  email: string;
  status: UserStatus;
  roleId?: number | null;
  actorType: ActorType;
  avatar?: string | null;
}
