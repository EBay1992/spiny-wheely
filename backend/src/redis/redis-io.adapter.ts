import { INestApplicationContext, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import type { ServerOptions } from 'socket.io';
import { resolveRedisPubSubConnection } from './redis.options';

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
    const connection = resolveRedisPubSubConnection();
    if (!connection) {
      throw new Error('Redis pub/sub connection is not configured');
    }

    this.pubClient =
      typeof connection === 'string' ? new Redis(connection) : new Redis(connection);
    this.subClient = this.pubClient.duplicate();
    await Promise.all([this.pubClient.ping(), this.subClient.ping()]);

    this.adapterConstructor = createAdapter(this.pubClient, this.subClient);
    const target =
      typeof connection === 'string'
        ? connection.replace(/:[^:@/]+@/, ':***@')
        : `${connection.host}:${connection.port}`;
    this.logger.log(`Socket.IO Redis adapter connected (${target})`);
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
