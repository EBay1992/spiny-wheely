import { describe, expect, it } from 'vitest';
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  integrationDescribe,
} from '../helpers/config';
import { apiRequest, loginAdmin } from '../helpers/http';

integrationDescribe('Operator configuration E2E', () => {
  it('operator can read and patch wheel RTP', async () => {
    const token = await loginAdmin(ADMIN_EMAIL, ADMIN_PASSWORD);

    const { body: configs } = await apiRequest<
      Array<{ id: string; gameType: string; targetRtp: string }>
    >('/admin/games/config', { token });

    const wheel = configs.find((config) => config.gameType === 'WHEEL');
    expect(wheel).toBeDefined();

    const originalRtp = wheel!.targetRtp;
    const patchedRtp = originalRtp === '95.00' ? 96.5 : 95.0;

    const { status, body: updated } = await apiRequest<{
      targetRtp: string;
    }>(`/admin/games/config/${wheel!.id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ targetRtp: patchedRtp }),
    });

    expect(status).toBe(200);
    expect(parseFloat(updated.targetRtp)).toBe(patchedRtp);

    await apiRequest(`/admin/games/config/${wheel!.id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ targetRtp: parseFloat(originalRtp) }),
    });
  });

  it('operator metrics reflect platform activity', async () => {
    const token = await loginAdmin(ADMIN_EMAIL, ADMIN_PASSWORD);

    const { status, body } = await apiRequest<{
      totalHandle: string;
      totalPayout: string;
      grossGamingRevenue: string;
    }>(
      '/admin/metrics?startDate=2024-01-01T00:00:00.000Z&endDate=2030-12-31T23:59:59.999Z',
      { token },
    );

    expect(status).toBe(200);
    expect(parseFloat(body.totalHandle)).toBeGreaterThanOrEqual(0);
    const handle = parseFloat(body.totalHandle);
    const payout = parseFloat(body.totalPayout);
    const ggr = parseFloat(body.grossGamingRevenue);
    expect(ggr).toBeCloseTo(handle - payout, 2);
  });
});
