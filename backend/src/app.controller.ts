import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HealthService } from './health/health.service';

@Controller()
export class AppController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  health(): { status: string; instanceId?: string } {
    return {
      status: 'ok',
      instanceId: process.env.INSTANCE_ID ?? process.env.HOSTNAME,
    };
  }

  @Get('health/ready')
  async readiness(): Promise<{
    status: string;
    checks: Record<string, string>;
    instanceId?: string;
  }> {
    const result = await this.healthService.readiness();
    const body = {
      status: result.status,
      checks: result.checks,
      instanceId: process.env.INSTANCE_ID ?? process.env.HOSTNAME,
    };

    if (result.status !== 'ok') {
      throw new ServiceUnavailableException(body);
    }

    return body;
  }
}
