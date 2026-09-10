import { ApiProperty } from '@nestjs/swagger';
import { LearningPath } from '../../../generated/prisma/client';

export class LearningPathPublicResponse {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiProperty() thumbnail!: string | null;
  @ApiProperty() difficulty!: number;

  constructor(learningPath: LearningPath) {
    this.id = learningPath.id;
    this.name = learningPath.name;
    this.thumbnail = learningPath.thumbnail;
    this.difficulty = learningPath.difficulty;
    // TODO: bổ sung wordSetCount khi có module WordSet
  }
}
