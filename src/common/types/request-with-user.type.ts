import { Request } from 'express';
import { AuthUser } from './auth-user.type';

export interface RequestWithUser extends Request {
  user: AuthUser;
}
