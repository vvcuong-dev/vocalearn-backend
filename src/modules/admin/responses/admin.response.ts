import { ApiProperty } from '@nestjs/swagger';
import { Admin, AdminStatus } from '../../../generated/prisma/client';

export class AdminResponse {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the admin',
  })
  id!: number;
  @ApiProperty({ example: 'John Doe', description: 'The name of the admin' })
  name!: string;
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'The email of the admin',
  })
  email!: string;
  @ApiProperty({
    enum: AdminStatus,
    example: AdminStatus.ACTIVE,
    description: 'The status of the admin',
  })
  status!: AdminStatus;
  @ApiProperty({
    example: 'https://res.cloudinary.com/.../avatar.jpg',
    nullable: true,
    description: 'The avatar of the admin',
  })
  avatar!: string | null;
  @ApiProperty({
    example: '0901234567',
    nullable: true,
    description: 'The phone number of the admin',
  })
  phone!: string | null;

  @ApiProperty({
    example: 1,
    nullable: true,
    description: 'The role ID of the admin',
  })
  roleId!: number | null;

  constructor(admin: Admin) {
    this.id = admin.id;
    this.name = admin.name;
    this.email = admin.email;
    this.status = admin.status;
    this.avatar = admin.avatar;
    this.phone = admin.phone;
    this.roleId = admin.roleId;
  }
}
