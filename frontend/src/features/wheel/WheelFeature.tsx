import React, { useState, useRef } from 'react';
import { WheelContainer } from './components/WheelContainer';
import { BetPanel } from './components/BetPanel';
import { FeatureContainer, Title } from './components/WheelStyles';
import { getPlayerProfile } from '../../core/network/api';
import { usePlayerStore } from '../../core/store/playerStore';
import { wheelSocket } from '../../core/network/socket';
import { celebrateWin } from '../../shared/utils/celebrate-win';
import { WinCelebration } from './components/WinCelebration';
import {
  formatWagerError,
  validateWager,
} from '../../shared/utils/wager-validation';
import type { SpinPathStep, SpinResult, WheelTier } from './types';

const TIER_LABEL: Record<WheelTier, string> = {
  small: 'Tier 1',
  middle: 'Tier 2',
  big: 'Tier 3',
};

function nextRotation(
  current: number,
  targetDeg: number,
  extraTurns = 6,
): number {
  const normalized = ((current % 360) + 360) % 360;
  const baseRotation = 360 * extraTurns;
  return current + baseRotation + (360 - targetDeg) - normalized;
}

export const WheelFeature: React.FC = () => {
  const {
    balance,
    wagerAmount,
    minWager,
    maxWager,
    isRoundActive,
    isReady,
    setWager,
    startRound,
    resolveRound,
    failRound,
    setBalance,
  } = usePlayerStore();

  const [innerRotation, setInnerRotation] = useState<number>(0);
  const [middleRotation, setMiddleRotation] = useState<number>(0);
  const [bigRotation, setBigRotation] = useState<number>(0);
  const [activeWheel, setActiveWheel] = useState<WheelTier>('small');
  const [roundStatus, setRoundStatus] = useState<string>('Ready to spin');
  const [statusIsError, setStatusIsError] = useState(false);
  const [isTurbo, setIsTurbo] = useState<boolean>(false);
  const [winPayout, setWinPayout] = useState<number | null>(null);
  const [statusIsWin, setStatusIsWin] = useState(false);

  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const winCelebrationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const animationTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAnimationTimeouts = () => {
    animationTimeoutsRef.current.forEach(clearTimeout);
    animationTimeoutsRef.current = [];
  };

  const schedule = (callback: () => void, delay: number) => {
    const timeout = setTimeout(callback, delay);
    animationTimeoutsRef.current.push(timeout);
  };

  const spinWheel = (step: SpinPathStep, extraTurns: number) => {
    if (step.wheel === 'small') {
      setInnerRotation((current) =>
        nextRotation(current, step.targetDeg, extraTurns),
      );
      return;
    }

    if (step.wheel === 'middle') {
      setMiddleRotation((current) =>
        nextRotation(current, step.targetDeg, extraTurns),
      );
      return;
    }

    setBigRotation((current) =>
      nextRotation(current, step.targetDeg, extraTurns),
    );
  };

  const animateSpinPath = (result: SpinResult, isTurboMode: boolean): number => {
    const spinDuration = isTurboMode ? 2000 : 6200;
    const thrustDelay = isTurboMode ? 280 : 750;
    const extraTurns = isTurboMode ? 4 : 7;
    let elapsed = 0;

    for (let index = 0; index < result.path.length; index += 1) {
      const step = result.path[index];
      const nextStep = result.path[index + 1];

      schedule(() => {
        setActiveWheel(step.wheel);
        setRoundStatus(`Spinning ${TIER_LABEL[step.wheel]}…`);
        spinWheel(step, extraTurns);
      }, elapsed);

      elapsed += spinDuration;

      if (step.type === 'next_wheel' && nextStep) {
        schedule(() => {
          setActiveWheel(nextStep.wheel);
          setRoundStatus('Next wheel!');
        }, elapsed);
        elapsed += thrustDelay;
      }
    }

    return elapsed;
  };

  const isNetWin = (result: SpinResult): boolean =>
    result.payoutAmount > result.wagerAmount;

  const formatResultStatus = (result: SpinResult): string => {
    const pathSummary = result.path.map((step) => step.label).join(' → ');

    if (result.payoutAmount <= 0) {
      return `${pathSummary} — lost $${result.wagerAmount.toFixed(2)} (balance $${result.balance.toFixed(2)})`;
    }

    if (isNetWin(result)) {
      const profit = result.payoutAmount - result.wagerAmount;
      return `${pathSummary} — won $${profit.toFixed(2)} (balance $${result.balance.toFixed(2)})`;
    }

    if (result.payoutAmount < result.wagerAmount) {
      const netLoss = result.wagerAmount - result.payoutAmount;
      return `${pathSummary} — lost $${netLoss.toFixed(2)} (balance $${result.balance.toFixed(2)})`;
    }

    return `${pathSummary} — broke even (balance $${result.balance.toFixed(2)})`;
  };

  const handleSpin = async () => {
    if (!isReady || isRoundActive) return;

    const check = validateWager(wagerAmount, minWager, maxWager, balance);
    if (!check.valid) {
      setStatusIsError(true);
      setRoundStatus(check.error ?? 'Invalid wager');
      return;
    }

    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
    if (winCelebrationTimeoutRef.current) {
      clearTimeout(winCelebrationTimeoutRef.current);
      winCelebrationTimeoutRef.current = null;
    }
    clearAnimationTimeouts();

    startRound();
    setStatusIsError(false);
    setStatusIsWin(false);
    setWinPayout(null);
    setRoundStatus('Spinning...');
    setActiveWheel('small');

    try {
      const result = await wheelSocket.placeWager(wagerAmount);
      const totalAnimationMs = animateSpinPath(result, isTurbo);

      schedule(() => {
        resolveRound(result);
        const isWin = isNetWin(result);
        if (isWin) {
          const netProfit = result.payoutAmount - result.wagerAmount;
          celebrateWin(result.payoutAmount, result.wagerAmount);
          setWinPayout(netProfit);
          winCelebrationTimeoutRef.current = setTimeout(() => {
            setWinPayout(null);
            winCelebrationTimeoutRef.current = null;
          }, 3000);
        }
        setStatusIsError(false);
        setStatusIsWin(isWin);
        setRoundStatus(formatResultStatus(result));

        resetTimeoutRef.current = setTimeout(() => {
          setActiveWheel('small');
          setStatusIsError(false);
          setStatusIsWin(false);
          setRoundStatus('Ready to spin');
        }, 3000);
      }, totalAnimationMs);
    } catch (error) {
      failRound();
      setActiveWheel('small');
      const message = formatWagerError(
        error instanceof Error ? error.message : 'Round failed',
      );
      setStatusIsError(true);
      setRoundStatus(message);

      try {
        const profile = await getPlayerProfile();
        setBalance(parseFloat(profile.wallet.balance), profile.wallet.currency);
      } catch {
        // Profile refresh failed — balance will sync on next load
      }
    }
  };

  return (
    <FeatureContainer>
      {winPayout !== null ? <WinCelebration netProfit={winPayout} /> : null}
      <Title>spinyWheely</Title>
      <WheelContainer
        innerRotation={innerRotation}
        middleRotation={middleRotation}
        bigRotation={bigRotation}
        activeWheel={activeWheel}
        transitionTime={isTurbo ? 2 : 6.2}
        isSpinning={isRoundActive}
      />
      <BetPanel
        onSpin={handleSpin}
        isRoundActive={isRoundActive}
        roundStatus={roundStatus}
        statusIsError={statusIsError}
        statusIsWin={statusIsWin}
        balance={balance}
        wagerAmount={wagerAmount}
        onSetWager={setWager}
        minWager={minWager}
        maxWager={maxWager}
        isTurbo={isTurbo}
        onToggleTurbo={() => setIsTurbo(!isTurbo)}
      />
    </FeatureContainer>
  );
};
