export interface IBaseRepository<TEntity, TKey extends number | string> {
  count(where?: Record<string, any>): Promise<number>;
  findAll(args?: Record<string, any>): Promise<TEntity[]>;
  findById(id: TKey, args?: Record<string, any>): Promise<TEntity | null>;
  findOne(where: Record<string, any>): Promise<TEntity | null>;
  findBy(where: Record<string, any>): Promise<TEntity[]>;
  findIn(
    field: string,
    values: any[],
    args?: Record<string, any>,
  ): Promise<TEntity[]>;
  create(data: Record<string, any>): Promise<TEntity>;
  update(id: TKey, data: Record<string, any>): Promise<TEntity | null>;
  deleteById(id: TKey): Promise<TEntity>;
  bulkCreate(data: Record<string, any>[]): Promise<{ count: number }>;
  bulkDelete(where: Record<string, any>): Promise<{ count: number }>;
}
