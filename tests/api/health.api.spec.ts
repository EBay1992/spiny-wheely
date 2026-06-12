import { describe, expect, it } from 'vitest';
import { apiRequest } from '../helpers/http';

describe('GET /health', () => {
  it('returns ok status', async () => {
    const { status, body } = await apiRequest<{ status: string }>('/health');

    expect(status).toBe(200);
    expect(body.status).toBe('ok');
  });
});
