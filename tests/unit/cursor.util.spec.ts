import { describe, expect, it } from 'vitest';
import {
  decodeBetHistoryCursor,
  encodeBetHistoryCursor,
} from '@backend/player/utils/cursor.util';

describe('wager history cursor', () => {
  it('round-trips timestamp and id', () => {
    const timestamp = new Date('2026-06-11T12:00:00.000Z');
    const id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

    const cursor = encodeBetHistoryCursor(timestamp, id);
    const decoded = decodeBetHistoryCursor(cursor);

    expect(decoded.id).toBe(id);
    expect(decoded.timestamp).toBe(timestamp.toISOString());
  });

  it('rejects malformed cursor', () => {
    expect(() => decodeBetHistoryCursor('not-valid-base64')).toThrow(
      'Invalid bet history cursor',
    );
  });

  it('rejects cursor missing fields', () => {
    const cursor = Buffer.from(JSON.stringify({ timestamp: 'x' })).toString(
      'base64url',
    );
    expect(() => decodeBetHistoryCursor(cursor)).toThrow(
      'Invalid bet history cursor',
    );
  });
});
