import { describe, expect, it } from 'vitest';
import { Volatility } from '@backend/common/enums/volatility.enum';
import { WheelRngEngine } from '@backend/game-math/wheel/wheel-rng.engine';
import {
  BIG_WHEEL_SEGMENTS,
  MIDDLE_WHEEL_SEGMENTS,
  SMALL_WHEEL_SEGMENTS,
} from '@backend/game-math/wheel/wheel-segment.definitions';

describe('WheelRngEngine', () => {
  const engine = new WheelRngEngine();

  it('resolves single-tier outcome with valid path metadata', () => {
    const outcome = engine.resolveRound(96, Volatility.MEDIUM);

    expect(outcome.path.length).toBeGreaterThanOrEqual(1);
    expect(outcome.path[0].wheel).toBe('small');
    expect(outcome.finalLabel).toBeTruthy();
    expect(typeof outcome.finalMultiplier).toBe('number');
  });

  it('produces multi-tier paths when NEXT is hit (statistical)', () => {
    let multiTier = 0;
    const rounds = 500;

    for (let i = 0; i < rounds; i += 1) {
      const outcome = engine.resolveRound(96, Volatility.MEDIUM);
      if (outcome.path.length > 1) {
        multiTier += 1;
        expect(outcome.path[0].label).toBe('NEXT');
      }
    }

    expect(multiTier).toBeGreaterThan(0);
  });

  it('produces three-tier paths when middle NEXT is hit (statistical)', () => {
    let threeTier = 0;
    const rounds = 2000;

    for (let i = 0; i < rounds; i += 1) {
      const outcome = engine.resolveRound(96, Volatility.MEDIUM);
      if (outcome.path.length === 3) {
        threeTier += 1;
        expect(outcome.path[0].label).toBe('NEXT');
        expect(outcome.path[1].label).toBe('NEXT');
        expect(outcome.path[2].wheel).toBe('big');
        expect(outcome.finalMultiplier).toBe(
          BIG_WHEEL_SEGMENTS[outcome.path[2].segmentIndex].multiplier,
        );
      }
    }

    expect(threeTier).toBeGreaterThan(0);
  });

  it('uses terminal tier multiplier as final outcome', () => {
    for (let i = 0; i < 100; i += 1) {
      const outcome = engine.resolveRound(95, Volatility.HIGH);
      const last = outcome.path[outcome.path.length - 1];
      const tiers = {
        small: SMALL_WHEEL_SEGMENTS,
        middle: MIDDLE_WHEEL_SEGMENTS,
        big: BIG_WHEEL_SEGMENTS,
      };
      const segment = tiers[last.wheel][last.segmentIndex];
      expect(outcome.finalMultiplier).toBe(segment.multiplier);
      expect(outcome.finalLabel).toBe(segment.label);
    }
  });

  it('includes valid stop angles for every path step', () => {
    for (let i = 0; i < 50; i += 1) {
      const outcome = engine.resolveRound(95, Volatility.HIGH);
      for (const step of outcome.path) {
        expect(step.stopAngle).toBeGreaterThanOrEqual(0);
        expect(step.stopAngle).toBeLessThan(360);
        expect(step.segmentIndex).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('never returns more than three tiers', () => {
    for (let i = 0; i < 100; i += 1) {
      const outcome = engine.resolveRound(96, Volatility.LOW);
      expect(outcome.path.length).toBeGreaterThanOrEqual(1);
      expect(outcome.path.length).toBeLessThanOrEqual(3);
    }
  });

  it('maps segment indices to known wheel definitions', () => {
    for (let i = 0; i < 30; i += 1) {
      const outcome = engine.resolveRound(96, Volatility.MEDIUM);
      const tiers = {
        small: SMALL_WHEEL_SEGMENTS,
        middle: MIDDLE_WHEEL_SEGMENTS,
        big: BIG_WHEEL_SEGMENTS,
      };

      for (const step of outcome.path) {
        const segment = tiers[step.wheel][step.segmentIndex];
        expect(segment.label).toBe(step.label);
        expect(segment.type).toBe(step.type);
      }
    }
  });
});
