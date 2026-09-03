import { SetMetadata } from '@nestjs/common';
import { ActorType } from '../../constants/actor-type.constant';

export const ACTOR_TYPE_KEY = 'actorType';
export const RequireActor = (actorType: ActorType) =>
  SetMetadata(ACTOR_TYPE_KEY, actorType);
