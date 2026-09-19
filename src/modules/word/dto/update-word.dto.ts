import { PartialType } from '@nestjs/swagger';
import { BaseWordDto } from './base-word.dto';

export class UpdateWordDto extends PartialType(BaseWordDto, {
  skipNullProperties: false,
}) {}
