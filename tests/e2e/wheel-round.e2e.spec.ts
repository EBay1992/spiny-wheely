import { describe, expect, it } from 'vitest';
import { integrationDescribe, PLAYER_EMAIL, PLAYER_PASSWORD } from '../helpers/config';
import { apiRequest, loginPlayer } from '../helpers/http';
import { fetchWheelPreview, placeWager } from '../helpers/wheel-socket';

integrationDescribe('Wheel round E2E', () => {
  it('returns wheel preview with three tiers', async () => {
    const preview = await fetchWheelPreview();

    expect(preview.gameType).toBe('WHEEL');
    expect(preview.isLive).toBe(true);
    expect(Array.isArray(preview.wheels)).toBe(true);
    expect((preview.wheels as unknown[]).length).toBe(3);
  });

  it('settles wager with server-authoritative balance', async () => {
    const token = await loginPlayer(PLAYER_EMAIL, PLAYER_PASSWORD);
    const wager = 0.1;
    const result = await placeWager(token, wager);

    expect(parseFloat(result.wagerAmount)).toBe(wager);

    const { body: profile } = await apiRequest<{
      wallet: { balance: string };
    }>('/player/profile', { token });

    expect(parseFloat(profile.wallet.balance)).toBeCloseTo(
      parseFloat(result.balance),
      2,
    );
    expect(result.path.length).toBeGreaterThanOrEqual(1);
    expect(result.path.length).toBeLessThanOrEqual(3);

    for (const step of result.path) {
      expect(step.stopAngle).toBeGreaterThanOrEqual(0);
      expect(step.stopAngle).toBeLessThan(360);
    }
  });

  it('payout equals wager × multiplier', async () => {
    const token = await loginPlayer(PLAYER_EMAIL, PLAYER_PASSWORD);
    const result = await placeWager(token, 1);

    const wager = parseFloat(result.wagerAmount);
    const payout = parseFloat(result.payoutAmount);
    expect(payout).toBeCloseTo(wager * result.multiplier, 2);
  });

  it('records round in wager history', async () => {
    const token = await loginPlayer(PLAYER_EMAIL, PLAYER_PASSWORD);
    await placeWager(token, 0.1);

    const { body } = await apiRequest<{
      items: Array<{ wagerAmount: string; payoutAmount: string }>;
    }>('/player/wager-history?limit=1', { token });

    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items[0].wagerAmount).toBeTruthy();
    expect(body.items[0].payoutAmount).toBeTruthy();
  });
});
