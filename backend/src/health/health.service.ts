import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { RedisService } from '../redis/redis.service';

export type HealthChecks = Record<string, 'ok' | 'fail'>;

@Injectable()
export class HealthService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly redis: RedisService,
  ) {}

  async readiness(): Promise<{ status: 'ok' | 'not_ready'; checks: HealthChecks }> {
    const checks: HealthChecks = {
      database: 'fail',
      redis: 'fail',
    };

    try {
      await this.dataSource.query('SELECT 1');
      checks.database = 'ok';
    } catch {
      checks.database = 'fail';
    }

    try {
      checks.redis = (await this.redis.ping()) ? 'ok' : 'fail';
    } catch {
      checks.redis = 'fail';
    }

    const ready = Object.values(checks).every((value) => value === 'ok');
    return { status: ready ? 'ok' : 'not_ready', checks };
  }
}
