import { Exclude, Expose, Type } from 'class-transformer';

class LearningPathBrief {
  @Expose() id?: number;
  @Expose() name?: string;
}
class CreatorBrief {
  @Expose() id?: number;
  @Expose() fullName?: string;
}
class FolderBrief {
  @Expose() id?: number;
  @Expose() name?: string;
}

@Exclude()
export class WordSetResponse {
  @Expose() id?: number;
  @Expose() name?: string;
  @Expose() order?: number;
  @Expose() description?: string | null;
  @Expose() wordCount?: number;
  @Expose() isPro?: boolean;
  @Expose() isPublic?: boolean;
  @Expose() isHiddenByAdmin?: boolean;
  @Expose() learningPathId?: number | null;
  @Expose() creatorId?: number | null;
  @Expose() folderId?: number | null;

  @Expose() @Type(() => LearningPathBrief) learningPath?: LearningPathBrief;
  @Expose() @Type(() => CreatorBrief) creator?: CreatorBrief;
  @Expose() @Type(() => FolderBrief) folder?: FolderBrief;

  @Expose() createdAt!: Date;
  @Expose() updatedAt!: Date;
}
