import { randomInt } from 'crypto';
import { Volatility } from '../../common/enums/volatility.enum';
import {
  BIG_WHEEL_SEGMENTS,
  MIDDLE_WHEEL_SEGMENTS,
  SMALL_WHEEL_SEGMENTS,
  segmentStopAngle,
  WheelSegmentDefinition,
  WheelTier,
} from './wheel-segment.definitions';

export interface WheelPathStep {
  wheel: WheelTier;
  segmentIndex: number;
  label: string;
  stopAngle: number;
  type: 'multiplier' | 'next_wheel';
}

export interface WheelRngOutcome {
  path: WheelPathStep[];
  finalMultiplier: number;
  finalLabel: string;
}

const BASE_WEIGHTS: Record<WheelTier, number[]> = {
  small: [14, 22, 16, 12, 14, 22, 16, 14],
  middle: [12, 12, 10, 20, 12, 12, 6, 20, 12],
  big: [10, 8, 10, 18, 3, 10, 8, 18, 10, 8, 5, 18, 8, 10, 8],
};

/** Server-side RNG for the 3-tier wheel (RTP-weighted segment selection). */
export class WheelRngEngine {
  resolveRound(targetRtp: number, volatility: Volatility): WheelRngOutcome {
    const path: WheelPathStep[] = [];

    const small = this.pickSegment(
      SMALL_WHEEL_SEGMENTS,
      this.buildWeights(SMALL_WHEEL_SEGMENTS, BASE_WEIGHTS.small, targetRtp, volatility),
    );
    path.push(this.toPathStep('small', small));

    if (small.type === 'next_wheel') {
      const middle = this.pickSegment(
        MIDDLE_WHEEL_SEGMENTS,
        this.buildWeights(MIDDLE_WHEEL_SEGMENTS, BASE_WEIGHTS.middle, targetRtp, volatility),
      );
      path.push(this.toPathStep('middle', middle));

      if (middle.type === 'next_wheel') {
        const big = this.pickSegment(
          BIG_WHEEL_SEGMENTS,
          this.buildWeights(BIG_WHEEL_SEGMENTS, BASE_WEIGHTS.big, targetRtp, volatility),
        );
        path.push(this.toPathStep('big', big));
        return {
          path,
          finalMultiplier: big.multiplier,
          finalLabel: big.label,
        };
      }

      return {
        path,
        finalMultiplier: middle.multiplier,
        finalLabel: middle.label,
      };
    }

    return {
      path,
      finalMultiplier: small.multiplier,
      finalLabel: small.label,
    };
  }

  private buildWeights(
    segments: WheelSegmentDefinition[],
    baseWeights: number[],
    targetRtp: number,
    volatility: Volatility,
  ): number[] {
    const housePressure = (100 - targetRtp) / 100;
    const volatilityBoost =
      volatility === Volatility.HIGH ? 1.15 : volatility === Volatility.LOW ? 0.85 : 1;

    return segments.map((segment, index) => {
      let weight = baseWeights[index] ?? 1;

      if (segment.type === 'next_wheel') {
        weight *= 1.1;
      } else if (segment.multiplier === 0) {
        weight *= 1 + housePressure * 5;
      } else if (segment.multiplier <= 0.5) {
        weight *= 1 + housePressure * 2;
      } else if (segment.multiplier >= 5) {
        weight *= Math.exp(-housePressure * 6) * volatilityBoost;
      } else if (segment.multiplier >= 2) {
        weight *= Math.exp(-housePressure * 2);
      }

      return Math.max(weight, 0.1);
    });
  }

  private pickSegment(
    segments: WheelSegmentDefinition[],
    weights: number[],
  ): WheelSegmentDefinition {
    const scaled = weights.map((w) => Math.max(1, Math.round(w * 1000)));
    const total = scaled.reduce((sum, w) => sum + w, 0);
    const roll = randomInt(total);
    let cumulative = 0;

    for (let i = 0; i < segments.length; i += 1) {
      cumulative += scaled[i];
      if (roll < cumulative) {
        return segments[i];
      }
    }

    return segments[segments.length - 1];
  }

  private toPathStep(
    wheel: WheelTier,
    segment: WheelSegmentDefinition,
  ): WheelPathStep {
    return {
      wheel,
      segmentIndex: segment.index,
      label: segment.label,
      stopAngle: segmentStopAngle(segment),
      type: segment.type,
    };
  }
}
