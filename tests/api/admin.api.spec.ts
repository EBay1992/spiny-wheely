import { describe, expect, it } from 'vitest';
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  integrationDescribe,
  PLAYER_EMAIL,
  PLAYER_PASSWORD,
} from '../helpers/config';
import { apiRequest, loginAdmin, loginPlayer } from '../helpers/http';

integrationDescribe('Operator (Admin) API', () => {
  let adminToken: string;

  it('POST /admin/auth/login — authenticates operator', async () => {
    const { status, body } = await apiRequest<{
      accessToken: string;
      role: string;
    }>('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });

    expect(status).toBe(201);
    expect(body.accessToken).toBeTruthy();
    expect(body.role).toBe('ADMIN');
    adminToken = body.accessToken;
  });

  it('GET /admin/metrics — returns GGR metrics', async () => {
    adminToken ??= await loginAdmin(ADMIN_EMAIL, ADMIN_PASSWORD);

    const { status, body } = await apiRequest<{
      totalHandle: string;
      totalPayout: string;
      grossGamingRevenue: string;
      holdPercentage: string;
    }>(
      '/admin/metrics?startDate=2024-01-01T00:00:00.000Z&endDate=2030-12-31T23:59:59.999Z',
      { token: adminToken },
    );

    expect(status).toBe(200);
    expect(body.totalHandle).toBeDefined();
    expect(body.grossGamingRevenue).toBeDefined();
    expect(body.holdPercentage).toBeDefined();
  });

  it('GET /admin/games/config — lists live game configuration', async () => {
    adminToken ??= await loginAdmin(ADMIN_EMAIL, ADMIN_PASSWORD);

    const { status, body } = await apiRequest<
      Array<{
        gameType: string;
        targetRtp: string;
        isLive: boolean;
      }>
    >('/admin/games/config', { token: adminToken });

    expect(status).toBe(200);
    expect(body.length).toBeGreaterThan(0);

    const wheel = body.find((config) => config.gameType === 'WHEEL');
    expect(wheel).toBeDefined();
    expect(wheel?.isLive).toBe(true);
  });

  it('rejects player token on operator routes', async () => {
    const playerToken = await loginPlayer(PLAYER_EMAIL, PLAYER_PASSWORD);
    const { status } = await apiRequest('/admin/metrics', { token: playerToken });
    expect(status).toBe(403);
  });

  it('GET /admin/metrics — requires authentication', async () => {
    const { status } = await apiRequest('/admin/metrics');
    expect([401, 403]).toContain(status);
  });
});
