import { io } from 'socket.io-client';
import { describe, expect, it } from 'vitest';
import {
  integrationDescribe,
  PLAYER_EMAIL,
  PLAYER_PASSWORD,
  WHEEL_NAMESPACE,
} from '../helpers/config';
import { apiRequest, loginPlayer } from '../helpers/http';
import { placeWager } from '../helpers/wheel-socket';

function spinWithoutResult(
  options: { token?: string; wagerAmount: number },
  waitMs = 3_000,
): Promise<{ gotResult: boolean; gotError: boolean }> {
  return new Promise((resolve) => {
    const socket = io(WHEEL_NAMESPACE, {
      auth: options.token ? { token: options.token } : undefined,
      transports: ['websocket'],
      forceNew: true,
    });

    let gotResult = false;
    let gotError = false;

    const finish = () => {
      socket.close();
      resolve({ gotResult, gotError });
    };

    const timer = setTimeout(finish, waitMs);

    socket.on('connect', () => {
      socket.emit('wheel:spin', { wagerAmount: options.wagerAmount });
    });

    socket.on('wheel:result', () => {
      gotResult = true;
      clearTimeout(timer);
      finish();
    });

    socket.on('wheel:error', () => {
      gotError = true;
      clearTimeout(timer);
      finish();
    });

    socket.on('exception', () => {
      gotError = true;
      clearTimeout(timer);
      finish();
    });
  });
}

integrationDescribe('Wheel security', () => {
  it('does not settle a round without JWT', async () => {
    const { gotResult, gotError } = await spinWithoutResult({ wagerAmount: 1 });
    expect(gotResult).toBe(false);
    expect(gotError).toBe(true);
  });

  it('rejects wager below minimum', async () => {
    const token = await loginPlayer(PLAYER_EMAIL, PLAYER_PASSWORD);
    const { gotResult, gotError } = await spinWithoutResult({
      token,
      wagerAmount: 0.01,
    });
    expect(gotResult).toBe(false);
    expect(gotError).toBe(true);
  });

  it('rejects wager above maximum', async () => {
    const token = await loginPlayer(PLAYER_EMAIL, PLAYER_PASSWORD);
    const { gotResult, gotError } = await spinWithoutResult({
      token,
      wagerAmount: 500,
    });
    expect(gotResult).toBe(false);
    expect(gotError).toBe(true);
  });

  it('settles using server identity from JWT only', async () => {
    const token = await loginPlayer(PLAYER_EMAIL, PLAYER_PASSWORD);
    const result = await placeWager(token, 0.1);

    const { body: profile } = await apiRequest<{
      wallet: { balance: string };
    }>('/player/profile', { token });

    expect(parseFloat(profile.wallet.balance)).toBeCloseTo(
      parseFloat(result.balance),
      2,
    );
    expect(result.roundId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});
