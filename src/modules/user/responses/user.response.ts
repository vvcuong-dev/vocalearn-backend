import { ApiProperty } from '@nestjs/swagger';
import { User, UserStatus } from '../../../generated/prisma/client';

export class UserResponse {
  @ApiProperty({ example: 1, description: 'The unique identifier of the user' })
  id!: number;
  @ApiProperty({ example: 'John Doe', description: 'The name of the user' })
  name!: string;
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'The email of the user',
  })
  email!: string;
  @ApiProperty({
    enum: UserStatus,
    example: UserStatus.ACTIVE,
    description: 'The status of the user',
  })
  status!: UserStatus;
  @ApiProperty({
    example: 'https://res.cloudinary.com/.../avatar.jpg',
    nullable: true,
    description: 'The avatar of the user',
  })
  avatar!: string | null;
  @ApiProperty({
    example: '0901234567',
    nullable: true,
    description: 'The phone number of the user',
  })
  phone!: string | null;

  constructor(user: User) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.status = user.status;
    this.avatar = user.avatar;
    this.phone = user.phone;
  }
}
