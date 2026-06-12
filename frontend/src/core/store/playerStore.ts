import { create } from 'zustand';
import type { SpinResult } from '../../features/wheel/types';
import { roundWager } from '../../shared/utils/wager-validation';

export interface PlayerState {
  balance: number;
  currency: string;
  wagerAmount: number;
  lastRound: SpinResult | null;
  isRoundActive: boolean;
  isReady: boolean;
  playerEmail: string | null;

  minWager: number;
  maxWager: number;

  setWager: (amount: number) => void;
  setBalance: (balance: number, currency?: string) => void;
  setReady: (
    email: string,
    balance: number,
    currency: string,
    minWager: number,
    maxWager: number,
  ) => void;
  startRound: () => void;
  resolveRound: (result: SpinResult) => void;
  failRound: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  balance: 0,
  currency: 'USD',
  wagerAmount: 1,
  lastRound: null,
  isRoundActive: false,
  isReady: false,
  playerEmail: null,

  minWager: 0.1,
  maxWager: 100,

  setWager: (amount) =>
    set((state) => {
      if (Number.isNaN(amount)) {
        return state;
      }
      const capped = Math.min(state.maxWager, state.balance, amount);
      const validWager = Math.max(state.minWager, capped);
      return { wagerAmount: roundWager(validWager) };
    }),

  setBalance: (balance, currency) =>
    set((state) => ({
      balance,
      currency: currency ?? state.currency,
    })),

  setReady: (email, balance, currency, minWager, maxWager) =>
    set({
      playerEmail: email,
      balance,
      currency,
      isReady: true,
      minWager,
      maxWager,
      wagerAmount: roundWager(
        Math.min(Math.max(minWager, 1), maxWager, balance),
      ),
    }),

  startRound: () =>
    set((state) => {
      if (!state.isReady || state.balance < state.wagerAmount || state.isRoundActive) {
        return state;
      }

      return {
        isRoundActive: true,
        lastRound: null,
        balance: parseFloat((state.balance - state.wagerAmount).toFixed(2)),
      };
    }),

  resolveRound: (result) =>
    set({
      balance: result.balance,
      currency: result.currency,
      isRoundActive: false,
      lastRound: result,
    }),

  failRound: () =>
    set((state) => ({
      isRoundActive: false,
      balance: parseFloat((state.balance + state.wagerAmount).toFixed(2)),
    })),
}));
