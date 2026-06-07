import { describe, expect, it } from 'vitest';
import { computeHouseEdge } from '@backend/common/utils/house-edge.util';

describe('computeHouseEdge', () => {
  it('computes house edge from RTP string', () => {
    expect(computeHouseEdge('96.50')).toBe('3.50');
  });

  it('computes house edge from RTP number', () => {
    expect(computeHouseEdge(95)).toBe('5.00');
  });

  it('returns 0 edge at 100% RTP', () => {
    expect(computeHouseEdge(100)).toBe('0.00');
  });
});
