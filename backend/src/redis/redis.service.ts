import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    this.client = new Redis({
      host: this.config.get<string>('REDIS_HOST', '127.0.0.1'),
      port: this.config.get<number>('REDIS_PORT', 6379),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.client.connect().catch((error: Error) => {
      this.logger.warn(`Redis connection failed: ${error.message}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.quit();
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
      return;
    }
    await this.client.set(key, value);
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  async publish(channel: string, message: string): Promise<void> {
    await this.client.publish(channel, message);
  }

  async ping(): Promise<boolean> {
    try {
      const response = await this.client.ping();
      return response === 'PONG';
    } catch {
      return false;
    }
  }
}
