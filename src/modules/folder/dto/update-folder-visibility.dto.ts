import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateFolderVisibilityDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  @IsNotEmpty()
  isPublic!: boolean;
}
