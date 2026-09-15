import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class BaseFolderDto {
  @ApiProperty({ example: 'TOEIC Reading' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
