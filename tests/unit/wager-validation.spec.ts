import { describe, expect, it } from 'vitest';
import {
  buildWagerPresets,
  formatWagerAmount,
  formatWagerError,
  isSameWager,
  roundWager,
  validateWager,
} from '@frontend/shared/utils/wager-validation';

describe('validateWager', () => {
  const min = 0.1;
  const max = 100;
  const balance = 50;

  it('accepts a valid wager within limits and balance', () => {
    expect(validateWager(10, min, max, balance)).toEqual({
      valid: true,
      error: null,
    });
  });

  it('rejects NaN', () => {
    expect(validateWager(Number.NaN, min, max, balance).valid).toBe(false);
  });

  it('rejects below minimum', () => {
    const result = validateWager(0.05, min, max, balance);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('0.10');
  });

  it('rejects above maximum', () => {
    const result = validateWager(150, min, max, balance);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('100.00');
  });

  it('rejects amount above balance', () => {
    const result = validateWager(60, min, max, balance);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Insufficient balance');
  });
});

describe('wager helpers', () => {
  it('rounds to two decimal places', () => {
    expect(roundWager(1.234)).toBe(1.23);
  });

  it('compares wagers with tolerance', () => {
    expect(isSameWager(1, 1.0005)).toBe(true);
    expect(isSameWager(1, 1.01)).toBe(false);
  });

  it('formats wager amounts', () => {
    expect(formatWagerAmount(5)).toBe('5.00');
  });

  it('maps API validation messages to friendly copy', () => {
    expect(formatWagerError('wagerAmount must not be less than 0.1')).toContain(
      '0.10',
    );
    expect(formatWagerError('Insufficient balance')).toBe(
      'Insufficient balance',
    );
  });

  it('builds presets within min, max, and balance', () => {
    const presets = buildWagerPresets(0.1, 100, 25, 5);
    expect(presets.length).toBeGreaterThan(0);
    expect(presets.every((v) => v >= 0.1 && v <= 25)).toBe(true);
  });
});
