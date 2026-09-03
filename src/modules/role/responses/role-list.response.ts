import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../generated/prisma/client';

export class RoleListResponse {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty()
  isSystem!: boolean;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  constructor(role: Role) {
    this.id = role.id;
    this.name = role.name;
    this.code = role.code;
    this.description = role.description;
    this.isSystem = role.isSystem;
    this.isActive = role.isActive;
    this.createdAt = role.createdAt;
  }
}
