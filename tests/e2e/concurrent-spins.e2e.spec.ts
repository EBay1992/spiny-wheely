import { describe, expect, it } from 'vitest';
import { integrationDescribe, PLAYER_EMAIL, PLAYER_PASSWORD } from '../helpers/config';
import { loginPlayer } from '../helpers/http';
import { placeWager } from '../helpers/wheel-socket';

integrationDescribe('Concurrent wheel rounds', () => {
  it('handles sequential spins without balance corruption', async () => {
    const token = await loginPlayer(PLAYER_EMAIL, PLAYER_PASSWORD);

    for (let i = 0; i < 5; i += 1) {
      const result = await placeWager(token, 0.1);
      const wager = parseFloat(result.wagerAmount);
      const payout = parseFloat(result.payoutAmount);

      expect(payout).toBeCloseTo(wager * result.multiplier, 2);

      const { body: profile } = await import('../helpers/http').then((m) =>
        m.apiRequest<{ wallet: { balance: string } }>('/player/profile', {
          token,
        }),
      );
      expect(parseFloat(profile.wallet.balance)).toBeCloseTo(
        parseFloat(result.balance),
        2,
      );
    }
  });
});
