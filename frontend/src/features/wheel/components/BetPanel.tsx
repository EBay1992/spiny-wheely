import React, { useEffect, useState } from 'react';
import { validateWager } from '../../../shared/utils/wager-validation';
import {
  ActionButton,
  ControlsContainer,
  GamePanel,
  IconButton,
  SpinButton,
  StatusText,
  WagerError,
  WagerHint,
  WagerInput,
  WagerLabel,
  WagerRow,
  WagerSection,
} from './WheelStyles';

interface BetPanelProps {
  onSpin: () => void;
  isRoundActive: boolean;
  roundStatus: string;
  statusIsError: boolean;
  balance: number;
  wagerAmount: number;
  onSetWager: (amount: number) => void;
  minWager: number;
  maxWager: number;
  isTurbo: boolean;
  onToggleTurbo: () => void;
}

export const BetPanel: React.FC<BetPanelProps> = ({
  onSpin,
  isRoundActive,
  roundStatus,
  statusIsError,
  balance,
  wagerAmount,
  onSetWager,
  minWager,
  maxWager,
  isTurbo,
  onToggleTurbo,
}) => {
  const [inputValue, setInputValue] = useState(wagerAmount.toFixed(2));
  const parsedInput = parseFloat(inputValue);
  const amountForValidation = Number.isNaN(parsedInput) ? wagerAmount : parsedInput;
  const validation = validateWager(amountForValidation, minWager, maxWager, balance);
  const wagerError = validation.valid ? null : validation.error;
  const canSpin =
    !isRoundActive && validation.valid && balance >= minWager;

  useEffect(() => {
    setInputValue(wagerAmount.toFixed(2));
  }, [wagerAmount]);

  const commitInput = () => {
    const parsed = parseFloat(inputValue);
    if (Number.isNaN(parsed)) {
      setInputValue(wagerAmount.toFixed(2));
      return;
    }
    onSetWager(parsed);
  };

  const stepWager = (delta: number) => {
    onSetWager(wagerAmount + delta);
  };

  return (
    <ControlsContainer>
      <GamePanel>
        <div className="stat">
          Balance: <span>${balance.toFixed(2)}</span>
        </div>

        <WagerSection>
          <WagerLabel>Wager amount</WagerLabel>
          <WagerRow>
            <IconButton
              type="button"
              onClick={() => stepWager(-1)}
              disabled={isRoundActive || wagerAmount <= minWager}
              aria-label="Decrease wager by one dollar"
            >
              −
            </IconButton>
            <WagerInput
              type="number"
              inputMode="decimal"
              min={minWager}
              max={maxWager}
              step={0.1}
              value={inputValue}
              $hasError={Boolean(wagerError)}
              disabled={isRoundActive}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={commitInput}
              aria-invalid={Boolean(wagerError)}
              aria-describedby={wagerError ? 'wager-error' : undefined}
            />
            <IconButton
              type="button"
              onClick={() => stepWager(1)}
              disabled={
                isRoundActive ||
                wagerAmount >= maxWager ||
                wagerAmount + 1 > balance
              }
              aria-label="Increase wager by one dollar"
            >
              +
            </IconButton>
          </WagerRow>
          <WagerHint>
            Min ${minWager.toFixed(2)} · Max ${maxWager.toFixed(2)}
          </WagerHint>
          {wagerError && <WagerError id="wager-error">{wagerError}</WagerError>}
        </WagerSection>

        <ActionButton
          type="button"
          onClick={onToggleTurbo}
          disabled={isRoundActive}
          $active={isTurbo}
        >
          {isTurbo ? '🚀 Turbo: ON' : '🐢 Turbo: OFF'}
        </ActionButton>
      </GamePanel>

      <SpinButton type="button" onClick={onSpin} disabled={!canSpin}>
        {isRoundActive ? 'SPINNING...' : 'SPIN'}
      </SpinButton>
      <StatusText $isError={statusIsError}>{roundStatus}</StatusText>
    </ControlsContainer>
  );
};
