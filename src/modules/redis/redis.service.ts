import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { redisConfig } from '../../configs/redis.config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private readonly logger = new Logger(RedisService.name);

  constructor() {
    this.client = createClient();
  }

  async onModuleInit() {
    const url = `redis://${redisConfig.host}:${redisConfig.port}`;
    this.client = createClient({
      url: url,
    });

    this.client.on('error', (err) =>
      this.logger.error('Redis Client Error', err),
    );

    await this.client.connect();
    this.logger.log('Redis client connected');
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  getClient(): RedisClientType {
    return this.client;
  }
}
