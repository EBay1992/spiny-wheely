import React, { useState } from 'react';
import {
  GearIcon,
  WagerGearButton,
  WagerPicker,
  WagerSettings,
} from '../../../shared/components/WagerPicker';
import { validateWager } from '../../../shared/utils/wager-validation';
import {
  ActionButton,
  BalanceStat,
  ControlsContainer,
  GamePanel,
  GamePanelFooter,
  GamePanelTopRow,
  SpinButton,
  StatusText,
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
  const [showWagerSettings, setShowWagerSettings] = useState(false);
  const validation = validateWager(wagerAmount, minWager, maxWager, balance);
  const canSpin =
    !isRoundActive && validation.valid && balance >= minWager;

  return (
    <ControlsContainer>
      <GamePanel>
        <GamePanelTopRow>
          <BalanceStat>
            Balance: <span>${balance.toFixed(2)}</span>
          </BalanceStat>

          <WagerPicker
            value={wagerAmount}
            onChange={onSetWager}
            minWager={minWager}
            maxWager={maxWager}
            balance={balance}
            disabled={isRoundActive}
            error={validation.valid ? null : validation.error}
            stepperOnly
            hideSettingsPanel
          />

          <WagerGearButton
            type="button"
            $active={showWagerSettings}
            disabled={isRoundActive}
            onClick={() => setShowWagerSettings((open) => !open)}
            aria-label={
              showWagerSettings ? 'Hide wager settings' : 'Show wager settings'
            }
            aria-expanded={showWagerSettings}
          >
            <GearIcon />
          </WagerGearButton>
        </GamePanelTopRow>

        {showWagerSettings && (
          <WagerSettings
            value={wagerAmount}
            onChange={onSetWager}
            minWager={minWager}
            maxWager={maxWager}
            balance={balance}
            disabled={isRoundActive}
          />
        )}

        <GamePanelFooter>
          <ActionButton
            type="button"
            onClick={onToggleTurbo}
            disabled={isRoundActive}
            $active={isTurbo}
          >
            {isTurbo ? 'Turbo: ON' : 'Turbo: OFF'}
          </ActionButton>
        </GamePanelFooter>
      </GamePanel>

      <SpinButton type="button" onClick={onSpin} disabled={!canSpin}>
        {isRoundActive ? 'SPINNING...' : 'SPIN'}
      </SpinButton>
      <StatusText $isError={statusIsError}>{roundStatus}</StatusText>
    </ControlsContainer>
  );
};
