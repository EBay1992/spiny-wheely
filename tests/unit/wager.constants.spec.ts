import { describe, expect, it } from 'vitest';
import {
  MAX_WAGER,
  MIN_WAGER,
} from '@backend/common/constants/wager.constants';

describe('wager limits', () => {
  it('defines platform min and max wager', () => {
    expect(MIN_WAGER).toBe(0.1);
    expect(MAX_WAGER).toBe(100);
    expect(MAX_WAGER).toBeGreaterThan(MIN_WAGER);
  });
});
