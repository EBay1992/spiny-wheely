import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getWheelPreview,
  simulateWheel,
  type WheelSimulateResult,
} from '../../core/network/api';
import {
  Card,
  CardTitle,
  ErrorText,
  FieldGroup,
  Input,
  Label,
  StatRow,
} from '../../shared/components/DashboardStyles';
import { DraggableWheelStack } from '../wheel/components/DraggableWheelStack';
import { ActionButton, FeatureContainer, Title } from '../wheel/components/WheelStyles';
import type { WheelTier } from '../wheel/types';

const TIER_LABEL: Record<WheelTier, string> = {
  small: 'Tier 1 (inner)',
  middle: 'Tier 2 (middle)',
  big: 'Tier 3 (outer)',
};

interface WheelPreviewSegment {
  index: number;
  label: string;
  multiplier: number;
  stopAngle: number;
  type: 'multiplier' | 'next_wheel';
}

interface WheelPreviewPayload {
  minWager: number;
  maxWager: number;
  wheels: Array<{
    wheel: WheelTier;
    segments: WheelPreviewSegment[];
  }>;
}

const SNAP_GRID_COLUMNS: Record<WheelTier, number> = {
  small: 4,
  middle: 3,
  big: 5,
};

const DRAG_TIERS: WheelTier[] = ['small', 'middle', 'big'];

export function WheelSimulatorFeature() {
  const [innerRotation, setInnerRotation] = useState(0);
  const [middleRotation, setMiddleRotation] = useState(0);
  const [bigRotation, setBigRotation] = useState(0);
  const [dragTier, setDragTier] = useState<WheelTier>('small');
  const [wagerAmount, setWagerAmount] = useState(1);
  const [preview, setPreview] = useState<WheelPreviewPayload | null>(null);
  const [simulation, setSimulation] = useState<WheelSimulateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getWheelPreview()
      .then((payload) => {
        setPreview(payload);
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load wheel preview');
        setLoading(false);
      });
  }, []);

  const runSimulation = useCallback(async () => {
    try {
      const result = await simulateWheel({
        wagerAmount,
        smallRotation: innerRotation,
        middleRotation,
        bigRotation,
      });
      setSimulation(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
    }
  }, [wagerAmount, innerRotation, middleRotation, bigRotation]);

  useEffect(() => {
    if (loading) return;

    const timeout = setTimeout(() => {
      void runSimulation();
    }, 250);

    return () => clearTimeout(timeout);
  }, [loading, runSimulation]);

  const handleRotationChange = useCallback((tier: WheelTier, rotation: number) => {
    if (tier === 'small') setInnerRotation(rotation);
    if (tier === 'middle') setMiddleRotation(rotation);
    if (tier === 'big') setBigRotation(rotation);
  }, []);

  const snapToSegment = useCallback(
    (tier: WheelTier, segmentIndex: number) => {
      const tierPreview = preview?.wheels.find((wheel) => wheel.wheel === tier);
      const segment = tierPreview?.segments.find((item) => item.index === segmentIndex);
      if (!segment) return;

      const rotation = (360 - segment.stopAngle + 360) % 360;
      handleRotationChange(tier, rotation);
    },
    [preview, handleRotationChange],
  );

  const activeTierSegments = useMemo(() => {
    return preview?.wheels.find((wheel) => wheel.wheel === dragTier)?.segments ?? [];
  }, [preview, dragTier]);

  const selectedIndexForTier = useCallback(
    (tier: WheelTier): number | null => {
      if (!simulation) return null;
      if (tier === 'small') return simulation.selectedSegments.small.index;
      if (tier === 'middle') return simulation.selectedSegments.middle?.index ?? null;
      return simulation.selectedSegments.big?.index ?? null;
    },
    [simulation],
  );

  const pathSummary = simulation?.path.map((step) => step.label).join(' → ') ?? '—';

  return (
    <FeatureContainer>
      <Title>Wheel Manual Test</Title>
      <p
        style={{
          color: '#94a3b8',
          textAlign: 'center',
          maxWidth: 560,
          margin: '0 0 1.5rem',
          lineHeight: 1.5,
        }}
      >
        Select a ring, then grab and rotate it under the pointer. Outcomes are resolved by the
        backend and saved to the test table only — no wallet debit.
      </p>

      {loading && <p style={{ color: '#fff' }}>Loading wheel geometry…</p>}
      {error && <ErrorText style={{ textAlign: 'center' }}>{error}</ErrorText>}

      {!loading && (
        <>
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            {DRAG_TIERS.map((tier) => (
              <ActionButton
                key={tier}
                type="button"
                $active={dragTier === tier}
                onClick={() => setDragTier(tier)}
              >
                Drag {TIER_LABEL[tier]}
              </ActionButton>
            ))}
          </div>

          <DraggableWheelStack
            innerRotation={innerRotation}
            middleRotation={middleRotation}
            bigRotation={bigRotation}
            dragTier={dragTier}
            onRotationChange={handleRotationChange}
          />

          <div
            style={{
              display: 'grid',
              gap: '1rem',
              width: '100%',
              maxWidth: 720,
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            }}
          >
            <Card>
              <CardTitle>Test wager</CardTitle>
              <FieldGroup>
                <Label htmlFor="sim-wager">Wager amount</Label>
                <Input
                  id="sim-wager"
                  type="number"
                  min={preview?.minWager ?? 0.1}
                  max={preview?.maxWager ?? 100}
                  step="0.1"
                  value={wagerAmount}
                  onChange={(event) => setWagerAmount(parseFloat(event.target.value) || 0)}
                />
              </FieldGroup>
              <ActionButton type="button" onClick={() => void runSimulation()}>
                Save test run
              </ActionButton>
            </Card>

            <Card>
              <CardTitle>Backend outcome</CardTitle>
              <StatRow>
                <span>Test run ID</span>
                <span style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                  {simulation?.testRunId ?? '—'}
                </span>
              </StatRow>
              <StatRow>
                <span>Path</span>
                <span>{pathSummary}</span>
              </StatRow>
              <StatRow>
                <span>Final label</span>
                <span>{simulation?.label ?? '—'}</span>
              </StatRow>
              <StatRow>
                <span>Multiplier</span>
                <span>{simulation?.multiplier ?? '—'}</span>
              </StatRow>
              <StatRow>
                <span>Payout</span>
                <span>${simulation?.payoutAmount ?? '0.00'}</span>
              </StatRow>
              <StatRow>
                <span>Net result</span>
                <span>${simulation?.netResult ?? '0.00'}</span>
              </StatRow>
            </Card>

            <Card style={{ gridColumn: '1 / -1' }}>
              <CardTitle>Quick snap — {TIER_LABEL[dragTier].toUpperCase()}</CardTitle>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>
                Optional shortcuts — drag the selected ring for fine control.
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${SNAP_GRID_COLUMNS[dragTier]}, minmax(0, 1fr))`,
                  gap: '0.5rem',
                }}
              >
                {activeTierSegments.map((segment) => {
                  const isSelected = selectedIndexForTier(dragTier) === segment.index;
                  return (
                    <ActionButton
                      key={segment.index}
                      type="button"
                      $active={isSelected}
                      onClick={() => snapToSegment(dragTier, segment.index)}
                    >
                      {segment.label}
                    </ActionButton>
                  );
                })}
              </div>
            </Card>
          </div>
        </>
      )}
    </FeatureContainer>
  );
}
