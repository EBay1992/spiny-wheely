import { describe, expect, it } from 'vitest';
import {
  ADMIN_EMAIL,
  integrationDescribe,
  PLAYER_EMAIL,
  PLAYER_PASSWORD,
} from '../helpers/config';
import { apiRequest, loginPlayer } from '../helpers/http';

integrationDescribe('Player API', () => {
  let playerToken: string;

  it('POST /player/auth/login — authenticates seeded player', async () => {
    const { status, body } = await apiRequest<{
      accessToken: string;
      role: string;
    }>('/player/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: PLAYER_EMAIL,
        password: PLAYER_PASSWORD,
      }),
    });

    expect(status).toBe(201);
    expect(body.accessToken).toBeTruthy();
    expect(body.role).toBe('PLAYER');
    playerToken = body.accessToken;
  });

  it('POST /player/auth/login — rejects invalid credentials', async () => {
    const { status } = await apiRequest('/player/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: PLAYER_EMAIL,
        password: 'wrong-password',
      }),
    });

    expect(status).toBe(401);
  });

  it('GET /player/profile — returns wallet balance', async () => {
    playerToken ??= await loginPlayer(PLAYER_EMAIL, PLAYER_PASSWORD);

    const { status, body } = await apiRequest<{
      email: string;
      wallet: { balance: string; currency: string };
    }>('/player/profile', { token: playerToken });

    expect(status).toBe(200);
    expect(body.email).toBe(PLAYER_EMAIL);
    expect(parseFloat(body.wallet.balance)).toBeGreaterThanOrEqual(0);
    expect(body.wallet.currency).toBeTruthy();
  });

  it('GET /player/profile — requires authentication', async () => {
    const { status } = await apiRequest('/player/profile');
    expect([401, 403]).toContain(status);
  });

  it('GET /player/wager-history — returns paginated ledger', async () => {
    playerToken ??= await loginPlayer(PLAYER_EMAIL, PLAYER_PASSWORD);

    const { status, body } = await apiRequest<{
      items: unknown[];
      hasMore: boolean;
      nextCursor: string | null;
    }>('/player/wager-history?limit=5', { token: playerToken });

    expect(status).toBe(200);
    expect(Array.isArray(body.items)).toBe(true);
    expect(typeof body.hasMore).toBe('boolean');
  });

  it('rejects operator token on player routes', async () => {
    const { loginAdmin } = await import('../helpers/http');
    const adminToken = await loginAdmin(
      ADMIN_EMAIL,
      process.env.TEST_ADMIN_PASSWORD ?? 'admin123',
    );

    const { status } = await apiRequest('/player/profile', { token: adminToken });
    expect(status).toBe(403);
  });
});
