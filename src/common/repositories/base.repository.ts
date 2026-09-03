import { PrismaService } from '../../prisma/prisma.service';
import { IBaseRepository } from './base-repository.interface';
import { AppException } from '../exceptions/app.exception';
import { VOCALEARN_ERROR_CODES } from '../../constants/error-code.constant';
import { Prisma } from '../../generated/prisma/client';

interface PrismaDelegate<TEntity> {
  count(args?: Record<string, any>): Promise<number>;
  findMany(args?: Record<string, any>): Promise<TEntity[]>;
  findUnique(args: Record<string, any>): Promise<TEntity | null>;
  findFirst(args: Record<string, any>): Promise<TEntity | null>;
  create(args: Record<string, any>): Promise<TEntity>;
  update(args: Record<string, any>): Promise<TEntity>;
  createMany(args: Record<string, any>): Promise<{ count: number }>;
  updateMany(args: Record<string, any>): Promise<{ count: number }>;
}

export abstract class BaseRepository<
  TEntity,
  TKey extends number | string,
> implements IBaseRepository<TEntity, TKey> {
  constructor(
    protected readonly modelName: Prisma.ModelName,
    protected readonly prisma: PrismaService,
  ) {}

  protected get delegate(): PrismaDelegate<TEntity> {
    return (this.prisma as unknown as Record<string, PrismaDelegate<TEntity>>)[
      this.modelName
    ];
  }

  async count(where?: Record<string, any>): Promise<number> {
    return await this.delegate.count({ where });
  }

  async findAll(args?: Record<string, any>): Promise<TEntity[]> {
    return await this.delegate.findMany(args);
  }

  async findById(
    id: TKey,
    args?: Record<string, any>,
  ): Promise<TEntity | null> {
    return await this.delegate.findUnique({ where: { id }, ...args });
  }

  async findOne(where: Record<string, any>): Promise<TEntity | null> {
    return await this.delegate.findFirst({ where });
  }

  async findBy(where: Record<string, any>): Promise<TEntity[]> {
    return await this.delegate.findMany({ where });
  }

  async findIn(
    field: string,
    values: any[],
    args?: Record<string, any>,
  ): Promise<TEntity[]> {
    const where: Record<string, any> = {
      ...(args?.where as Record<string, any>),
      [field]: { in: values },
    };
    return await this.delegate.findMany({ ...args, where });
  }

  async create(data: Record<string, any>): Promise<TEntity> {
    try {
      return await this.delegate.create({ data });
    } catch (err) {
      this.handlePrismaError(err);
    }
  }

  async update(id: TKey, data: Record<string, any>): Promise<TEntity | null> {
    try {
      return await this.delegate.update({ where: { id }, data });
    } catch (err) {
      this.handlePrismaError(err);
    }
  }

  async deleteById(id: TKey): Promise<TEntity> {
    try {
      return await this.delegate.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (err) {
      this.handlePrismaError(err);
    }
  }

  async bulkCreate(data: Record<string, any>[]): Promise<{ count: number }> {
    return await this.delegate.createMany({ data, skipDuplicates: true });
  }

  async bulkDelete(where: Record<string, any>): Promise<{ count: number }> {
    return await this.delegate.updateMany({
      where,
      data: { deletedAt: new Date() },
    });
  }

  protected handlePrismaError(err: any): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025')
        throw new AppException(VOCALEARN_ERROR_CODES.COMMON.NOT_FOUND, 404);
      if (err.code === 'P2002')
        throw new AppException(VOCALEARN_ERROR_CODES.COMMON.CONFLICT, 409);
    }
    throw err;
  }
}
