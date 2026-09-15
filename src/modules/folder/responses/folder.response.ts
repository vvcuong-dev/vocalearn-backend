import { ApiProperty } from '@nestjs/swagger';
import { Folder } from '../../../generated/prisma/client';

export class FolderResponse {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() isPublic!: boolean;
  @ApiProperty() isHiddenByAdmin!: boolean;
  @ApiProperty() upvoteCount!: number;
  @ApiProperty() creatorId!: number;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;

  constructor(folder: Folder) {
    this.id = folder.id;
    this.name = folder.name;
    this.slug = folder.slug as string;
    this.isPublic = folder.isPublic;
    this.isHiddenByAdmin = folder.isHiddenByAdmin;
    this.upvoteCount = folder.upvoteCount;
    this.creatorId = folder.creatorId;
    this.createdAt = folder.createdAt;
    this.updatedAt = folder.updatedAt;
  }
}
