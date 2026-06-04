export type WheelTier = 'small' | 'middle' | 'big';
export type SegmentKind = 'multiplier' | 'next_wheel';

export interface WheelSegmentDefinition {
  index: number;
  label: string;
  type: SegmentKind;
  multiplier: number;
  startDeg: number;
  endDeg: number;
}

/** Segment geometry mirrors the frontend wheel art (Ring1/2/3). */
export const SMALL_WHEEL_SEGMENTS: WheelSegmentDefinition[] = [
  { index: 0, label: 'NEXT', type: 'next_wheel', multiplier: 0, startDeg: 334.4, endDeg: 36.7 },
  { index: 1, label: '0x', type: 'multiplier', multiplier: 0, startDeg: 36.7, endDeg: 88.1 },
  { index: 2, label: '0.5x', type: 'multiplier', multiplier: 0.5, startDeg: 88.1, endDeg: 139.7 },
  { index: 3, label: '1.5x', type: 'multiplier', multiplier: 1.5, startDeg: 139.7, endDeg: 181.8 },
  { index: 4, label: '1x', type: 'multiplier', multiplier: 1, startDeg: 181.8, endDeg: 216.8 },
  { index: 5, label: '0x', type: 'multiplier', multiplier: 0, startDeg: 216.8, endDeg: 268.2 },
  { index: 6, label: '0.5x', type: 'multiplier', multiplier: 0.5, startDeg: 268.2, endDeg: 319.7 },
  { index: 7, label: 'NEXT', type: 'next_wheel', multiplier: 0, startDeg: 319.7, endDeg: 334.4 },
];

export const MIDDLE_WHEEL_SEGMENTS: WheelSegmentDefinition[] = [
  { index: 0, label: '2x', type: 'multiplier', multiplier: 2, startDeg: 5, endDeg: 18.8 },
  { index: 1, label: '1.5x', type: 'multiplier', multiplier: 1.5, startDeg: 18.8, endDeg: 62 },
  { index: 2, label: 'NEXT', type: 'next_wheel', multiplier: 0, startDeg: 62, endDeg: 107.2 },
  { index: 3, label: '0x', type: 'multiplier', multiplier: 0, startDeg: 107.2, endDeg: 154.4 },
  { index: 4, label: '2x', type: 'multiplier', multiplier: 2, startDeg: 154.4, endDeg: 202.3 },
  { index: 5, label: '1.5x', type: 'multiplier', multiplier: 1.5, startDeg: 202.3, endDeg: 249.3 },
  { index: 6, label: '5x', type: 'multiplier', multiplier: 5, startDeg: 249.3, endDeg: 294 },
  { index: 7, label: '0x', type: 'multiplier', multiplier: 0, startDeg: 294, endDeg: 336.7 },
  { index: 8, label: '2x', type: 'multiplier', multiplier: 2, startDeg: 336.7, endDeg: 5 },
];

export const BIG_WHEEL_SEGMENTS: WheelSegmentDefinition[] = [
  { index: 0, label: '2x', type: 'multiplier', multiplier: 2, startDeg: 20.3, endDeg: 42.1 },
  { index: 1, label: '3x', type: 'multiplier', multiplier: 3, startDeg: 42.1, endDeg: 64.2 },
  { index: 2, label: '2x', type: 'multiplier', multiplier: 2, startDeg: 64.2, endDeg: 86.4 },
  { index: 3, label: '0x', type: 'multiplier', multiplier: 0, startDeg: 86.4, endDeg: 109.2 },
  { index: 4, label: '10x', type: 'multiplier', multiplier: 10, startDeg: 109.2, endDeg: 132.1 },
  { index: 5, label: '2x', type: 'multiplier', multiplier: 2, startDeg: 132.1, endDeg: 155.3 },
  { index: 6, label: '3x', type: 'multiplier', multiplier: 3, startDeg: 155.3, endDeg: 178.6 },
  { index: 7, label: '0x', type: 'multiplier', multiplier: 0, startDeg: 178.6, endDeg: 201.8 },
  { index: 8, label: '2x', type: 'multiplier', multiplier: 2, startDeg: 201.8, endDeg: 225 },
  { index: 9, label: '3x', type: 'multiplier', multiplier: 3, startDeg: 225, endDeg: 247.9 },
  { index: 10, label: '5x', type: 'multiplier', multiplier: 5, startDeg: 247.9, endDeg: 270.5 },
  { index: 11, label: '0x', type: 'multiplier', multiplier: 0, startDeg: 270.5, endDeg: 292.9 },
  { index: 12, label: '3x', type: 'multiplier', multiplier: 3, startDeg: 292.9, endDeg: 315 },
  { index: 13, label: '2x', type: 'multiplier', multiplier: 2, startDeg: 315, endDeg: 336.8 },
  { index: 14, label: '3x', type: 'multiplier', multiplier: 3, startDeg: 336.8, endDeg: 20.3 },
];

export function segmentStopAngle(segment: WheelSegmentDefinition): number {
  if (segment.startDeg <= segment.endDeg) {
    return (segment.startDeg + segment.endDeg) / 2;
  }
  const span = 360 - segment.startDeg + segment.endDeg;
  return (segment.startDeg + span / 2) % 360;
}
