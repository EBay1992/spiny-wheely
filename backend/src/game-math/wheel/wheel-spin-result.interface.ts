import { WheelPathStep } from './wheel-rng.engine';

export interface WheelSpinResult {
  roundId: string;
  path: WheelPathStep[];
  label: string;
  multiplier: number;
  wagerAmount: string;
  payoutAmount: string;
  balance: string;
  currency: string;
}
