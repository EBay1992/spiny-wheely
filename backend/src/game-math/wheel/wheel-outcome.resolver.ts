import {
  BIG_WHEEL_SEGMENTS,
  MIDDLE_WHEEL_SEGMENTS,
  SMALL_WHEEL_SEGMENTS,
  segmentStopAngle,
  WheelSegmentDefinition,
  WheelTier,
} from './wheel-segment.definitions';
import { WheelPathStep, WheelRngOutcome } from './wheel-rng.engine';

export interface SelectedSegmentView {
  index: number;
  label: string;
  type: 'multiplier' | 'next_wheel';
  multiplier: number;
  pointerAngle: number;
  rotation: number;
}

export interface WheelSimulateOutcome extends WheelRngOutcome {
  selectedSegments: {
    small: SelectedSegmentView;
    middle?: SelectedSegmentView;
    big?: SelectedSegmentView;
  };
}

const TIER_SEGMENTS: Record<WheelTier, WheelSegmentDefinition[]> = {
  small: SMALL_WHEEL_SEGMENTS,
  middle: MIDDLE_WHEEL_SEGMENTS,
  big: BIG_WHEEL_SEGMENTS,
};

export function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

/** Wheel-art angle under the fixed top pointer for a CSS rotation value. */
export function pointerAngleOnWheel(rotationDeg: number): number {
  return normalizeDegrees(360 - rotationDeg);
}

/** CSS rotation that places a segment stop angle under the top pointer. */
export function rotationForPointerAngle(pointerAngle: number): number {
  return normalizeDegrees(360 - pointerAngle);
}

export function segmentAtPointerAngle(
  segments: WheelSegmentDefinition[],
  pointerAngle: number,
): WheelSegmentDefinition {
  const angle = normalizeDegrees(pointerAngle);

  for (const segment of segments) {
    if (segment.startDeg <= segment.endDeg) {
      if (angle >= segment.startDeg && angle < segment.endDeg) {
        return segment;
      }
      continue;
    }

    if (angle >= segment.startDeg || angle < segment.endDeg) {
      return segment;
    }
  }

  return segments[0];
}

function toPathStep(
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

function toSelectedSegment(
  segment: WheelSegmentDefinition,
  rotation: number,
): SelectedSegmentView {
  const pointerAngle = pointerAngleOnWheel(rotation);
  return {
    index: segment.index,
    label: segment.label,
    type: segment.type,
    multiplier: segment.multiplier,
    pointerAngle,
    rotation: normalizeDegrees(rotation),
  };
}

export function resolveFromIndices(
  smallIndex: number,
  middleIndex?: number,
  bigIndex?: number,
): WheelRngOutcome {
  const small = SMALL_WHEEL_SEGMENTS[smallIndex];
  if (!small) {
    throw new Error(`Invalid small wheel segment index: ${smallIndex}`);
  }

  const path: WheelPathStep[] = [toPathStep('small', small)];

  if (small.type !== 'next_wheel') {
    return {
      path,
      finalMultiplier: small.multiplier,
      finalLabel: small.label,
    };
  }

  if (middleIndex === undefined) {
    throw new Error('Middle wheel segment is required after small NEXT');
  }

  const middle = MIDDLE_WHEEL_SEGMENTS[middleIndex];
  if (!middle) {
    throw new Error(`Invalid middle wheel segment index: ${middleIndex}`);
  }

  path.push(toPathStep('middle', middle));

  if (middle.type !== 'next_wheel') {
    return {
      path,
      finalMultiplier: middle.multiplier,
      finalLabel: middle.label,
    };
  }

  if (bigIndex === undefined) {
    throw new Error('Big wheel segment is required after middle NEXT');
  }

  const big = BIG_WHEEL_SEGMENTS[bigIndex];
  if (!big) {
    throw new Error(`Invalid big wheel segment index: ${bigIndex}`);
  }

  path.push(toPathStep('big', big));

  return {
    path,
    finalMultiplier: big.multiplier,
    finalLabel: big.label,
  };
}

export function resolveFromRotations(
  smallRotation: number,
  middleRotation: number,
  bigRotation: number,
): WheelSimulateOutcome {
  const smallSegment = segmentAtPointerAngle(
    TIER_SEGMENTS.small,
    pointerAngleOnWheel(smallRotation),
  );
  const selectedSegments: WheelSimulateOutcome['selectedSegments'] = {
    small: toSelectedSegment(smallSegment, smallRotation),
  };

  const path: WheelPathStep[] = [toPathStep('small', smallSegment)];

  if (smallSegment.type !== 'next_wheel') {
    return {
      path,
      finalMultiplier: smallSegment.multiplier,
      finalLabel: smallSegment.label,
      selectedSegments,
    };
  }

  const middleSegment = segmentAtPointerAngle(
    TIER_SEGMENTS.middle,
    pointerAngleOnWheel(middleRotation),
  );
  selectedSegments.middle = toSelectedSegment(middleSegment, middleRotation);
  path.push(toPathStep('middle', middleSegment));

  if (middleSegment.type !== 'next_wheel') {
    return {
      path,
      finalMultiplier: middleSegment.multiplier,
      finalLabel: middleSegment.label,
      selectedSegments,
    };
  }

  const bigSegment = segmentAtPointerAngle(
    TIER_SEGMENTS.big,
    pointerAngleOnWheel(bigRotation),
  );
  selectedSegments.big = toSelectedSegment(bigSegment, bigRotation);
  path.push(toPathStep('big', bigSegment));

  return {
    path,
    finalMultiplier: bigSegment.multiplier,
    finalLabel: bigSegment.label,
    selectedSegments,
  };
}
