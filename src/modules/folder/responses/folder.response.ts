import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Folder } from '../../../generated/prisma/client';

export type FolderEntity = Folder & {
  _count?: { wordSets: number };
};

export class FolderResponse {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() isPublic!: boolean;
  @ApiProperty() isHiddenByAdmin!: boolean;
  @ApiProperty() upvoteCount!: number;
  @ApiProperty() creatorId!: number;
  @ApiPropertyOptional({ example: 3 }) wordSetCount?: number;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;

  constructor(folder: FolderEntity) {
    this.id = folder.id;
    this.name = folder.name;
    this.slug = folder.slug;
    this.isPublic = folder.isPublic;
    this.isHiddenByAdmin = folder.isHiddenByAdmin;
    this.upvoteCount = folder.upvoteCount;
    this.creatorId = folder.creatorId;
    // chỉ gán khi query có join _count — các chỗ create/update/setHidden sẽ không có field này
    if (folder._count) {
      this.wordSetCount = folder._count.wordSets;
    }
    this.createdAt = folder.createdAt;
    this.updatedAt = folder.updatedAt;
  }
}
