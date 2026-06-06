import React from 'react';
import { ControlsContainer, SpinButton, StatusText, ActionButton, IconButton, GamePanel } from './WheelStyles';

interface BetPanelProps {
  onSpin: () => void;
  isRoundActive: boolean;
  roundStatus: string;
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
  balance,
  wagerAmount,
  onSetWager,
  minWager,
  maxWager,
  isTurbo,
  onToggleTurbo,
}) => {
  return (
    <ControlsContainer>
      <GamePanel>
        <div className="stat">Balance: <span>${balance.toFixed(2)}</span></div>
        <div className="bet-controls">
          Wager:
          <IconButton
            onClick={() => onSetWager(wagerAmount - 1)}
            disabled={isRoundActive || wagerAmount <= minWager}
          >
            -
          </IconButton>
          <span className="bet-amount">${wagerAmount.toFixed(2)}</span>
          <IconButton
            onClick={() => onSetWager(wagerAmount + 1)}
            disabled={isRoundActive || wagerAmount >= maxWager || wagerAmount >= balance}
          >
            +
          </IconButton>
        </div>
        <ActionButton onClick={onToggleTurbo} disabled={isRoundActive} $active={isTurbo}>
          {isTurbo ? '🚀 Turbo: ON' : '🐢 Turbo: OFF'}
        </ActionButton>
      </GamePanel>

      <SpinButton onClick={onSpin} disabled={isRoundActive || balance < wagerAmount}>
        {isRoundActive ? 'SPINNING...' : 'SPIN'}
      </SpinButton>
      <StatusText>{roundStatus}</StatusText>
    </ControlsContainer>
  );
};
