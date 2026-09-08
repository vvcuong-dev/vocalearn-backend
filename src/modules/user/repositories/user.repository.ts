import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { User } from '../../../generated/prisma/client';

@Injectable()
export class UserRepository extends BaseRepository<User, number> {
  constructor(prisma: PrismaService) {
    super('User', prisma);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.delegate.findFirst({ where: { email, deleted: false } });
  }
}
