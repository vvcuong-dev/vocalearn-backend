import { ApiProperty } from '@nestjs/swagger';
import { Permission } from '../../../generated/prisma/client';

export class PermissionResponse {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ nullable: true })
  group!: string | null;

  constructor(permission: Permission) {
    this.id = permission.id;
    this.name = permission.name;
    this.code = permission.code;
    this.group = permission.group;
  }
}
