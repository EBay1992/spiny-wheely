import { INestApplicationContext, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import type { ServerOptions } from 'socket.io';

/**
 * Shares Socket.IO rooms/events across API replicas via Redis pub/sub.
 * Required when running multiple pods behind a load balancer.
 */
export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor!: ReturnType<typeof createAdapter>;
  private pubClient!: Redis;
  private subClient!: Redis;

  constructor(private readonly app: INestApplicationContext) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const config = this.app.get(ConfigService);
    const host = config.get<string>('REDIS_HOST', '127.0.0.1');
    const port = config.get<number>('REDIS_PORT', 6379);
    const redisOptions = { host, port, maxRetriesPerRequest: null as null };

    this.pubClient = new Redis(redisOptions);
    this.subClient = this.pubClient.duplicate();
    await Promise.all([this.pubClient.ping(), this.subClient.ping()]);

    this.adapterConstructor = createAdapter(this.pubClient, this.subClient);
    this.logger.log(`Socket.IO Redis adapter connected (${host}:${port})`);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }

  async close(): Promise<void> {
    await Promise.allSettled([this.pubClient?.quit(), this.subClient?.quit()]);
  }
}
