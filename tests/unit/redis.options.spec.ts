import { afterEach, describe, expect, it } from 'vitest';
import {
  isRedisConfigured,
  resolveRedisConnection,
} from '@backend/redis/redis.options';

const ENV_KEYS = ['REDIS_URL', 'REDIS_HOST', 'REDIS_PORT'] as const;

function clearRedisEnv(): void {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
}

describe('redis.options', () => {
  afterEach(() => {
    clearRedisEnv();
  });

  it('detects REDIS_URL', () => {
    process.env.REDIS_URL = 'rediss://default:token@redis.example.com:6379';
    expect(isRedisConfigured()).toBe(true);
    expect(resolveRedisConnection()).toBe(process.env.REDIS_URL);
  });

  it('detects local REDIS_HOST', () => {
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '6379';
    expect(isRedisConfigured()).toBe(true);
    const connection = resolveRedisConnection();
    expect(connection).toMatchObject({ host: 'localhost', port: 6379 });
  });

  it('returns null when Redis is not configured', () => {
    clearRedisEnv();
    expect(isRedisConfigured()).toBe(false);
    expect(resolveRedisConnection()).toBeNull();
  });
});
