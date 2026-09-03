import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';
import { CacheFetcher, TTL } from '../../constants/cache.constant';

@Injectable()
export class CacheService {
  constructor(private readonly redisService: RedisService) {}

  private get redis() {
    return this.redisService.getClient();
  }

  async getOrSer<T>(
    key: string,
    fetchFn: CacheFetcher<T>,
    ttl: number = TTL.MEDIUM,
  ): Promise<T> {
    const cacheData = await this.redis.get(key);
    if (cacheData) {
      return JSON.parse(cacheData) as T;
    }

    const freshData = await fetchFn();
    if (freshData) {
      await this.redis.set(key, JSON.stringify(freshData), { EX: ttl });
    }

    return freshData;
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  // async deleteByPattern(pattern: string): Promise<void> {
  //   const keys = this.redis.scanIterator({ TYPE: 'string', MATCH: pattern });
  //   for await (const key of keys) {
  //     await this.redis.del(key);
  //   }
  // }

  async deleteByPattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length === 0) return;
    await this.redis.del(keys);
  }

  async tagVersion(tagName: string) {
    const versionKey = `tag:${tagName}:version`;
    let version = await this.redis.get(versionKey);
    if (!version) {
      version = '1';
      await this.redis.set(versionKey, version);
    }
    return version;
  }

  async invalidateTagVersion(tagName: string) {
    const versionKey = `tag:${tagName}:version`;
    return this.redis.incr(versionKey);
  }

  async getOrSetWithTag<T>(
    key: string,
    fetchFn: CacheFetcher<T>,
    tags: string[],
    ttl: number = TTL.MEDIUM,
  ): Promise<T> {
    const cacheData = await this.redis.get(key);
    if (cacheData) {
      return JSON.parse(cacheData) as T;
    }

    const freshData = await fetchFn();
    if (freshData) {
      const multi = this.redis.multi();
      multi.set(key, JSON.stringify(freshData), { EX: ttl });

      const tagName = `tag:${tags.join(':')}`;
      multi.sAdd(tagName, key);
      multi.expire(tagName, ttl);

      await multi.exec();
    }
    return freshData;
  }

  async invalidateTags(tags: string[]) {
    const prefix = `tag:${tags.join(':')}`;
    const allKeysToDelete = new Set<string>();

    let cursor = '0';
    do {
      const reply = await this.redis.scan(cursor, {
        MATCH: `${prefix}*`,
        COUNT: 100,
      });
      cursor = reply.cursor;

      for (const tagName of reply.keys) {
        const memberKeys = await this.redis.sMembers(tagName);
        memberKeys.forEach((key) => allKeysToDelete.add(key));
        allKeysToDelete.add(tagName);
      }
    } while (cursor !== '0');

    if (allKeysToDelete.size > 0) {
      await this.redis.unlink(Array.from(allKeysToDelete));
    }
  }

  async writeThrough<T>(
    key: string,
    dbAction: CacheFetcher<T>,
    ttl: number = TTL.MEDIUM,
  ): Promise<T> {
    const result = await dbAction();
    await this.redis.set(key, JSON.stringify(result), { EX: ttl });
    return result;
  }
}
