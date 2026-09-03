import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Admin } from '../../../generated/prisma/browser';

@Injectable()
export class AdminRepository extends BaseRepository<Admin, number> {
  constructor(prisma: PrismaService) {
    super('Admin', prisma);
  }

  async findByEmail(email: string): Promise<Admin | null> {
    return this.delegate.findFirst({ where: { email, deleted: false } });
  }
}
