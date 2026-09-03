import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsString } from 'class-validator';

export class AssignPermissionsDto {
  @ApiProperty({ type: [String], example: ['USER_LIST', 'USER_CREATE'] })
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  permissionCodes!: string[];
}
