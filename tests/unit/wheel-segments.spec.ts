import { describe, expect, it } from 'vitest';
import {
  BIG_WHEEL_SEGMENTS,
  MIDDLE_WHEEL_SEGMENTS,
  SMALL_WHEEL_SEGMENTS,
  segmentStopAngle,
} from '@backend/game-math/wheel/wheel-segment.definitions';

describe('wheel segment definitions', () => {
  it('defines expected segment counts per tier', () => {
    expect(SMALL_WHEEL_SEGMENTS).toHaveLength(8);
    expect(MIDDLE_WHEEL_SEGMENTS).toHaveLength(9);
    expect(BIG_WHEEL_SEGMENTS).toHaveLength(15);
  });

  it('has unique indices within each tier', () => {
    for (const segments of [
      SMALL_WHEEL_SEGMENTS,
      MIDDLE_WHEEL_SEGMENTS,
      BIG_WHEEL_SEGMENTS,
    ]) {
      const indices = segments.map((segment) => segment.index);
      expect(new Set(indices).size).toBe(indices.length);
    }
  });

  it('includes NEXT segments on inner and middle tiers only', () => {
    const smallNext = SMALL_WHEEL_SEGMENTS.filter((s) => s.type === 'next_wheel');
    const middleNext = MIDDLE_WHEEL_SEGMENTS.filter((s) => s.type === 'next_wheel');
    const bigNext = BIG_WHEEL_SEGMENTS.filter((s) => s.type === 'next_wheel');

    expect(smallNext.length).toBe(2);
    expect(middleNext.length).toBe(1);
    expect(bigNext.length).toBe(0);
  });

  it('computes stop angles within 0–360', () => {
    for (const segments of [
      SMALL_WHEEL_SEGMENTS,
      MIDDLE_WHEEL_SEGMENTS,
      BIG_WHEEL_SEGMENTS,
    ]) {
      for (const segment of segments) {
        const angle = segmentStopAngle(segment);
        expect(angle).toBeGreaterThanOrEqual(0);
        expect(angle).toBeLessThan(360);
      }
    }
  });

  it('assigns 0 multiplier to loss and NEXT segments', () => {
    for (const segments of [SMALL_WHEEL_SEGMENTS, MIDDLE_WHEEL_SEGMENTS]) {
      for (const segment of segments) {
        if (segment.label === '0x' || segment.type === 'next_wheel') {
          expect(segment.multiplier).toBe(0);
        }
      }
    }
  });
});
