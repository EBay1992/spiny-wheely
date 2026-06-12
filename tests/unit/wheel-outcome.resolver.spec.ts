import {
  pointerAngleOnWheel,
  resolveFromIndices,
  resolveFromRotations,
  rotationForPointerAngle,
  segmentAtPointerAngle,
} from '../../backend/src/game-math/wheel/wheel-outcome.resolver';
import {
  MIDDLE_WHEEL_SEGMENTS,
  SMALL_WHEEL_SEGMENTS,
  segmentStopAngle,
} from '../../backend/src/game-math/wheel/wheel-segment.definitions';

describe('wheel-outcome.resolver', () => {
  it('maps rotation and pointer angle inversely', () => {
    const pointerAngle = 139.7;
    const rotation = rotationForPointerAngle(pointerAngle);
    expect(pointerAngleOnWheel(rotation)).toBeCloseTo(pointerAngle, 5);
  });

  it('resolves a single-tier small multiplier from indices', () => {
    const outcome = resolveFromIndices(3);
    expect(outcome.path).toHaveLength(1);
    expect(outcome.finalLabel).toBe('1.5x');
    expect(outcome.finalMultiplier).toBe(1.5);
  });

  it('resolves a two-tier path after small NEXT', () => {
    const outcome = resolveFromIndices(0, 6);
    expect(outcome.path).toHaveLength(2);
    expect(outcome.finalLabel).toBe('5x');
    expect(outcome.finalMultiplier).toBe(5);
  });

  it('resolves segment under pointer from rotation', () => {
    const segment = SMALL_WHEEL_SEGMENTS[3];
    const rotation = rotationForPointerAngle(segmentStopAngle(segment));
    const outcome = resolveFromRotations(rotation, 0, 0);

    expect(outcome.selectedSegments.small.index).toBe(3);
    expect(outcome.finalLabel).toBe('1.5x');
  });

  it('ignores middle/big rotations when small settles immediately', () => {
    const small = SMALL_WHEEL_SEGMENTS[1];
    const smallRotation = rotationForPointerAngle(segmentStopAngle(small));
    const outcome = resolveFromRotations(smallRotation, 180, 270);

    expect(outcome.path).toHaveLength(1);
    expect(outcome.finalLabel).toBe('0x');
    expect(outcome.selectedSegments.middle).toBeUndefined();
  });

  it('uses middle rotation only when small lands on NEXT', () => {
    const small = SMALL_WHEEL_SEGMENTS[0];
    const middle = MIDDLE_WHEEL_SEGMENTS[6];
    const outcome = resolveFromRotations(
      rotationForPointerAngle(segmentStopAngle(small)),
      rotationForPointerAngle(segmentStopAngle(middle)),
      0,
    );

    expect(outcome.path).toHaveLength(2);
    expect(outcome.selectedSegments.middle?.index).toBe(6);
    expect(outcome.finalLabel).toBe('5x');
  });

  it('finds wrapped small segments', () => {
    const segment = segmentAtPointerAngle(SMALL_WHEEL_SEGMENTS, 350);
    expect(segment.label).toBe('NEXT');
  });
});
