import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ACTOR_TYPE_KEY } from '../decorators/actor.decorator';
import { AppException } from '../exceptions/app.exception';
import { VOCALEARN_ERROR_CODES } from '../../constants/error-code.constant';
import type { RequestWithUser } from '../types/request-with-user.type';
import { ActorType } from '../../constants/actor-type.constant';

@Injectable()
export class ActorGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredActor = this.reflector.getAllAndOverride<ActorType>(
      ACTOR_TYPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredActor) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (request.user?.actorType !== requiredActor) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.AUTH.INVALID_CREDENTIALS,
        HttpStatus.FORBIDDEN,
      );
    }
    return true;
  }
}
