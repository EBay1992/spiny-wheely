export type WheelTier = 'small' | 'middle' | 'big';

export type SegmentType = 'multiplier' | 'next_wheel';

export interface SpinPathStep {
  wheel: WheelTier;
  segmentIndex: number;
  label: string;
  type: SegmentType;
  /** Server-computed stop angle — animation only. */
  targetDeg: number;
}

export interface SpinResult {
  path: SpinPathStep[];
  multiplier: number;
  payoutAmount: number;
  wagerAmount: number;
  /** Authoritative balance from server after settlement. */
  balance: number;
  currency: string;
  roundId: string;
  label: string;
}
