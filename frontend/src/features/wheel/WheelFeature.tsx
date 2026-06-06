import React, { useState, useRef } from 'react';
import { WheelContainer } from './components/WheelContainer';
import { BetPanel } from './components/BetPanel';
import { FeatureContainer, Title } from './components/WheelStyles';
import { getPlayerProfile } from '../../core/network/api';
import { usePlayerStore } from '../../core/store/playerStore';
import { wheelSocket } from '../../core/network/socket';
import type { SpinPathStep, SpinResult, WheelTier } from './types';

const TIER_LABEL: Record<WheelTier, string> = {
  small: 'Tier 1',
  middle: 'Tier 2',
  big: 'Tier 3',
};

function nextRotation(current: number, targetDeg: number, extraTurns = 5): number {
  const baseRotation = 360 * extraTurns;
  return current + baseRotation + (360 - targetDeg) - (current % 360);
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
  const [isTurbo, setIsTurbo] = useState<boolean>(false);

  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAnimationTimeouts = () => {
    animationTimeoutsRef.current.forEach(clearTimeout);
    animationTimeoutsRef.current = [];
  };

  const schedule = (callback: () => void, delay: number) => {
    const timeout = setTimeout(callback, delay);
    animationTimeoutsRef.current.push(timeout);
  };

  const spinWheel = (step: SpinPathStep) => {
    if (step.wheel === 'small') {
      setInnerRotation((current) => nextRotation(current, step.targetDeg));
      return;
    }

    if (step.wheel === 'middle') {
      setMiddleRotation((current) => nextRotation(current, step.targetDeg));
      return;
    }

    setBigRotation((current) => nextRotation(current, step.targetDeg));
  };

  const animateSpinPath = (result: SpinResult, isTurboMode: boolean): number => {
    const spinDuration = isTurboMode ? 1500 : 5000;
    const thrustDelay = isTurboMode ? 200 : 600;
    let elapsed = 0;

    for (let index = 0; index < result.path.length; index += 1) {
      const step = result.path[index];
      const nextStep = result.path[index + 1];

      schedule(() => {
        setActiveWheel(step.wheel);
        setRoundStatus(`Spinning ${TIER_LABEL[step.wheel]}…`);
        spinWheel(step);
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

  const formatResultStatus = (result: SpinResult): string => {
    const pathSummary = result.path.map((step) => step.label).join(' → ');

    if (result.payoutAmount <= 0) {
      return `${pathSummary} — lost $${result.wagerAmount.toFixed(2)} (balance $${result.balance.toFixed(2)})`;
    }

    return `${pathSummary} — won $${result.payoutAmount.toFixed(2)} (balance $${result.balance.toFixed(2)})`;
  };

  const handleSpin = async () => {
    if (!isReady || isRoundActive || balance < wagerAmount) return;

    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
    clearAnimationTimeouts();

    startRound();
    setRoundStatus('Spinning...');
    setActiveWheel('small');

    try {
      const result = await wheelSocket.placeWager(wagerAmount);
      const totalAnimationMs = animateSpinPath(result, isTurbo);

      schedule(() => {
        resolveRound(result);
        setRoundStatus(formatResultStatus(result));

        resetTimeoutRef.current = setTimeout(() => {
          setActiveWheel('small');
          setRoundStatus('Ready to spin');
        }, 3000);
      }, totalAnimationMs);
    } catch (error) {
      failRound();
      setActiveWheel('small');
      const message = error instanceof Error ? error.message : 'Round failed';
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
      <Title>spinyWheely</Title>
      <WheelContainer
        innerRotation={innerRotation}
        middleRotation={middleRotation}
        bigRotation={bigRotation}
        activeWheel={activeWheel}
        transitionTime={isTurbo ? 1.5 : 5}
      />
      <BetPanel
        onSpin={handleSpin}
        isRoundActive={isRoundActive}
        roundStatus={roundStatus}
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
