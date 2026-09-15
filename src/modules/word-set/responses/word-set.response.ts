import { Prisma, WordSet } from '../../../generated/prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const INCLUDE = {
  learningPath: { select: { id: true, name: true } },
  creator: { select: { id: true, name: true } },
  folder: { select: { id: true, name: true } },
} satisfies Prisma.WordSetInclude;

export type WordSetEntity = WordSet &
  Partial<Prisma.WordSetGetPayload<{ include: typeof INCLUDE }>>;

class LearningPathBrief {
  @ApiProperty({ example: 1 })
  id: number;
  @ApiProperty({ example: 'TOEIC cơ bản' })
  name: string;

  constructor(learningPath: { id: number; name: string }) {
    this.id = learningPath.id;
    this.name = learningPath.name;
  }
}

class CreatorBrief {
  @ApiProperty({ example: 1 })
  id: number;
  @ApiProperty({ example: 'Nguyễn Văn An' })
  fullName: string;

  constructor(creator: { id: number; name: string }) {
    this.id = creator.id;
    this.fullName = creator.name;
  }
}

class FolderBrief {
  @ApiProperty({ example: 1 })
  id: number;
  @ApiProperty({ example: 'Ôn tập TOEIC' })
  name: string;

  constructor(folder: { id: number; name: string }) {
    this.id = folder.id;
    this.name = folder.name;
  }
}

export class WordSetResponse {
  @ApiProperty({ example: 1 })
  id: number;
  @ApiProperty({ example: 'Từ vựng TOEIC - Công việc' })
  name: string;
  @ApiProperty({ example: 'tu-vung-toeic-cong-viec' })
  slug!: string;
  @ApiProperty({ example: 1 })
  order: number;
  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Các từ vựng thường gặp tại nơi làm việc',
  })
  description: string | null;
  @ApiProperty({ example: 20 })
  wordCount: number;
  @ApiProperty({ example: false })
  isPro: boolean;

  @ApiPropertyOptional({ type: () => LearningPathBrief })
  learningPath?: LearningPathBrief;

  @ApiPropertyOptional({ type: () => CreatorBrief })
  creator?: CreatorBrief;

  @ApiPropertyOptional({ type: () => FolderBrief })
  folder?: FolderBrief;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  constructor(entity: WordSetEntity) {
    this.id = entity.id;
    this.name = entity.name;
    this.order = entity.order;
    this.description = entity.description;
    this.wordCount = entity.wordCount;
    this.isPro = entity.isPro;
    this.learningPath = entity.learningPath
      ? new LearningPathBrief(entity.learningPath)
      : undefined;
    this.creator = entity.creator
      ? new CreatorBrief(entity.creator)
      : undefined;
    this.folder = entity.folder ? new FolderBrief(entity.folder) : undefined;
    this.createdAt = entity.createdAt;
    this.updatedAt = entity.updatedAt;
  }
}
