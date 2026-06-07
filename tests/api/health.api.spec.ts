import { describe, expect, it } from 'vitest';
import { integrationDescribe } from '../helpers/config';
import { apiRequest } from '../helpers/http';

integrationDescribe('GET /health', () => {
  it('returns ok status', async () => {
    const { status, body } = await apiRequest<{ status: string }>('/health');

    expect(status).toBe(200);
    expect(body.status).toBe('ok');
  });
});
