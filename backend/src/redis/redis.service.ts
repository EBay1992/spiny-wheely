import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';
import { isRedisConfigured, resolveRedisConnection } from './redis.options';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client?: Redis;
  readonly enabled: boolean;

  constructor() {
    this.enabled = isRedisConfigured();
  }

  onModuleInit(): void {
    if (!this.enabled) {
      this.logger.log('Redis disabled (set REDIS_URL or REDIS_HOST); using database only');
      return;
    }

    const connection = resolveRedisConnection();
    if (!connection) {
      return;
    }

    this.client =
      typeof connection === 'string' ? new Redis(connection) : new Redis(connection);

    this.client.connect().catch((error: Error) => {
      this.logger.warn(`Redis connection failed: ${error.message}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.quit();
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) {
      return null;
    }
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) {
      return;
    }
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
      return;
    }
    await this.client.set(key, value);
  }

  async del(...keys: string[]): Promise<void> {
    if (!this.client || keys.length === 0) {
      return;
    }
    await this.client.del(...keys);
  }

  async publish(channel: string, message: string): Promise<void> {
    if (!this.client) {
      return;
    }
    await this.client.publish(channel, message);
  }

  async ping(): Promise<boolean> {
    if (!this.client) {
      return true;
    }
    try {
      const response = await this.client.ping();
      return response === 'PONG';
    } catch {
      return false;
    }
  }
}
