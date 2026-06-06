import { create } from 'zustand';
import type { SpinResult } from '../../features/wheel/types';

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
      const clamped = Math.max(state.minWager, Math.min(state.maxWager, amount));
      const validWager = Math.min(clamped, state.balance);
      return { wagerAmount: Number(validWager.toFixed(2)) };
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
      wagerAmount: Math.min(Math.max(minWager, 1), balance),
    }),

  startRound: () =>
    set((state) => {
      if (!state.isReady || state.balance < state.wagerAmount || state.isRoundActive) {
        return state;
      }

      return {
        isRoundActive: true,
        lastRound: null,
      };
    }),

  resolveRound: (result) =>
    set({
      balance: result.balance,
      currency: result.currency,
      isRoundActive: false,
      lastRound: result,
    }),

  failRound: () => set({ isRoundActive: false }),
}));
