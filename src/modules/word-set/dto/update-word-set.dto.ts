import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateAdminWordSetDto } from './create-admin-word-set.dto';

export class UpdateWordSetDto extends PartialType(
  OmitType(CreateAdminWordSetDto, ['learningPathId'] as const),
) {}
