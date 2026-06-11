import { useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  buildWagerPresets,
  formatWagerAmount,
  isSameWager,
  roundWager,
  validateWager,
} from '../utils/wager-validation';
import { ErrorText } from './DashboardStyles';

const Section = styled.div<{ $inline?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  width: ${({ $inline }) => ($inline ? 'auto' : '100%')};
`;

const ControlRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  flex-wrap: nowrap;
`;

const Label = styled.span`
  flex-shrink: 0;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
  white-space: nowrap;
  margin-right: 0.15rem;

  @media (max-width: 400px) {
    display: none;
  }
`;

export const WagerGearButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border-radius: 8px;
  border: 1px solid
    ${({ $active }) =>
      $active ? 'rgba(129, 140, 248, 0.55)' : 'rgba(148, 163, 184, 0.25)'};
  background: ${({ $active }) =>
    $active ? 'rgba(99, 102, 241, 0.2)' : 'rgba(15, 23, 42, 0.5)'};
  color: ${({ $active }) => ($active ? '#c7d2fe' : '#94a3b8')};
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;

  &:hover:not(:disabled) {
    border-color: rgba(129, 140, 248, 0.45);
    color: #e2e8f0;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const StepButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border-radius: 50%;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(15, 23, 42, 0.55);
  color: #f8fafc;
  font-size: 1.35rem;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, transform 0.12s;

  &:hover:not(:disabled) {
    border-color: rgba(129, 140, 248, 0.5);
    background: rgba(99, 102, 241, 0.2);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    transform: none;
  }
`;

const AmountDisplay = styled.div<{ $hasError?: boolean }>`
  flex-shrink: 0;
  min-width: 5.25rem;
  padding: 0.45rem 0.6rem;
  border-radius: 10px;
  border: 1px solid
    ${({ $hasError }) =>
      $hasError ? 'rgba(248, 113, 113, 0.7)' : 'rgba(148, 163, 184, 0.28)'};
  background: rgba(2, 6, 23, 0.5);
  color: #fbbf24;
  font-size: 1rem;
  font-weight: 700;
  text-align: center;
  font-family: 'Inter', sans-serif;
  font-variant-numeric: tabular-nums;
`;

const SettingsPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 0.85rem;
  border-radius: 10px;
  background: rgba(2, 6, 23, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.18);
`;

const SettingsBlock = styled.div`
  font-size: 0.82rem;
  color: #94a3b8;
  line-height: 1.55;

  strong {
    color: #e2e8f0;
    font-weight: 600;
  }
`;

const PresetsTitle = styled.p`
  margin: 0;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
`;

const PresetGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
`;

const PresetChip = styled.button<{ $selected?: boolean }>`
  flex: 1 1 calc(33% - 0.45rem);
  min-width: 4rem;
  padding: 0.5rem 0.4rem;
  border-radius: 8px;
  border: 1px solid
    ${({ $selected }) =>
      $selected ? 'rgba(129, 140, 248, 0.65)' : 'rgba(148, 163, 184, 0.2)'};
  background: ${({ $selected }) =>
    $selected ? 'rgba(99, 102, 241, 0.3)' : 'rgba(15, 23, 42, 0.45)'};
  color: ${({ $selected }) => ($selected ? '#fff' : '#cbd5e1')};
  font-size: 0.88rem;
  font-weight: ${({ $selected }) => ($selected ? 700 : 600)};
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;

  &:hover:not(:disabled) {
    border-color: rgba(129, 140, 248, 0.45);
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
`;

export function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M19.4 13a7.9 7.9 0 0 0 .1-2l2-1.2-2-3.5-2.3.7a8 8 0 0 0-1.7-1L15 3h-4l-.5 2.9a8 8 0 0 0-1.7 1l-2.3-.7-2 3.5 2 1.2a7.9 7.9 0 0 0 .1 2l-2 1.2 2 3.5 2.3-.7a8 8 0 0 0 1.7 1L11 21h4l.5-2.9a8 8 0 0 0 1.7-1l2.3.7 2-3.5-2-1.2Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const STEP = 1;

export interface WagerSettingsProps {
  value: number;
  onChange: (amount: number) => void;
  minWager: number;
  maxWager: number;
  balance: number;
  disabled?: boolean;
}

export function WagerSettings({
  value,
  onChange,
  minWager,
  maxWager,
  balance,
  disabled = false,
}: WagerSettingsProps) {
  const presets = useMemo(
    () => buildWagerPresets(minWager, maxWager, balance),
    [minWager, maxWager, balance],
  );

  return (
    <SettingsPanel>
      <SettingsBlock>
        <div>
          Minimum: <strong>${minWager.toFixed(2)}</strong>
        </div>
        <div>
          Maximum: <strong>${maxWager.toFixed(2)}</strong>
        </div>
        <div>
          Balance: <strong>${balance.toFixed(2)}</strong>
        </div>
      </SettingsBlock>

      <div>
        <PresetsTitle>Quick picks</PresetsTitle>
        <PresetGrid style={{ marginTop: '0.5rem' }}>
          {presets.map((amount) => {
            const chipValid = validateWager(
              amount,
              minWager,
              maxWager,
              balance,
            ).valid;
            return (
              <PresetChip
                key={amount}
                type="button"
                $selected={isSameWager(value, amount)}
                disabled={disabled || !chipValid}
                onClick={() => onChange(amount)}
              >
                ${formatWagerAmount(amount)}
              </PresetChip>
            );
          })}
        </PresetGrid>
      </div>
    </SettingsPanel>
  );
}

export interface WagerPickerProps {
  value: number;
  onChange: (amount: number) => void;
  minWager: number;
  maxWager: number;
  balance: number;
  disabled?: boolean;
  error?: string | null;
  /** Hide label and gear — use with external WagerGearButton */
  stepperOnly?: boolean;
  showSettings?: boolean;
  onShowSettingsChange?: (open: boolean) => void;
  /** Render settings panel inline (default) or omit when parent renders WagerSettings */
  hideSettingsPanel?: boolean;
}

export function WagerPicker({
  value,
  onChange,
  minWager,
  maxWager,
  balance,
  disabled = false,
  error = null,
  stepperOnly = false,
  showSettings: showSettingsProp,
  onShowSettingsChange,
  hideSettingsPanel = false,
}: WagerPickerProps) {
  const [internalSettings, setInternalSettings] = useState(false);
  const isControlled = onShowSettingsChange !== undefined;
  const showSettings = isControlled
    ? (showSettingsProp ?? false)
    : internalSettings;

  const toggleSettings = () => {
    const next = !showSettings;
    if (isControlled) {
      onShowSettingsChange?.(next);
    } else {
      setInternalSettings(next);
    }
  };

  const effectiveMax = Math.min(maxWager, balance);
  const validation = validateWager(value, minWager, maxWager, balance);
  const displayError = error ?? (validation.valid ? null : validation.error);

  const stepWager = (delta: number) => {
    const next = roundWager(value + delta);
    const capped = Math.min(effectiveMax, Math.max(minWager, next));
    onChange(capped);
  };

  const canDecrease = value > minWager && !disabled;
  const canIncrease = value < effectiveMax && !disabled;

  return (
    <Section $inline={stepperOnly} aria-label="Wager amount">
      <ControlRow>
        {!stepperOnly && <Label>Wager</Label>}
        <StepButton
          type="button"
          disabled={!canDecrease}
          onClick={() => stepWager(-STEP)}
          aria-label={`Decrease wager by $${STEP}`}
        >
          −
        </StepButton>
        <AmountDisplay $hasError={Boolean(displayError)} aria-live="polite">
          ${formatWagerAmount(value)}
        </AmountDisplay>
        <StepButton
          type="button"
          disabled={!canIncrease}
          onClick={() => stepWager(STEP)}
          aria-label={`Increase wager by $${STEP}`}
        >
          +
        </StepButton>
        {!stepperOnly && (
          <WagerGearButton
            type="button"
            $active={showSettings}
            disabled={disabled}
            onClick={toggleSettings}
            aria-label={showSettings ? 'Hide wager settings' : 'Show wager settings'}
            aria-expanded={showSettings}
          >
            <GearIcon />
          </WagerGearButton>
        )}
      </ControlRow>

      {showSettings && !hideSettingsPanel && (
        <WagerSettings
          value={value}
          onChange={onChange}
          minWager={minWager}
          maxWager={maxWager}
          balance={balance}
          disabled={disabled}
        />
      )}

      {displayError && <ErrorText style={{ marginTop: 0 }}>{displayError}</ErrorText>}
    </Section>
  );
}
