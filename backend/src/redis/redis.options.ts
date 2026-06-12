import type { RedisOptions } from 'ioredis';

/** True when Redis is configured via REDIS_URL or REDIS_HOST. */
export function isRedisConfigured(): boolean {
  return resolveRedisConnection() !== null;
}

/**
 * Resolves ioredis connection settings.
 * Prefer REDIS_URL when set (`redis://` or `rediss://`).
 * Fall back to REDIS_HOST + REDIS_PORT for local Docker / Fly embedded Redis.
 */
export function resolveRedisConnection(): string | RedisOptions | null {
  const url = process.env.REDIS_URL?.trim();
  if (url) {
    return url;
  }

  const host = process.env.REDIS_HOST?.trim();
  if (!host) {
    return null;
  }

  return {
    host,
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  };
}

/** Socket.IO pub/sub clients require maxRetriesPerRequest: null. */
export function resolveRedisPubSubConnection(): string | RedisOptions | null {
  const connection = resolveRedisConnection();
  if (connection === null) {
    return null;
  }

  if (typeof connection === 'string') {
    return connection;
  }

  return {
    ...connection,
    maxRetriesPerRequest: null,
    lazyConnect: false,
  };
}
