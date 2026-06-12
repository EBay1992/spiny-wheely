import { useCallback, useEffect, useState } from 'react';
import {
  getGameConfigurations,
  getPlatformMetrics,
  updateGameConfiguration,
  type GameConfig,
  type PlatformMetrics,
} from '../../core/network/api';
import {
  DateRangePicker,
  defaultMetricsRange,
} from '../../shared/components/DateRangePicker';
import { DashboardLayout } from '../../shared/components/DashboardLayout';
import {
  Badge,
  Button,
  Card,
  CardTitle,
  ErrorText,
  FieldGroup,
  Grid,
  Input,
  Label,
  PageTitle,
  Select,
  StatRow,
  SuccessText,
} from '../../shared/components/DashboardStyles';
import {
  METRICS_DATE_PRESETS,
  localDayEndIso,
  localDayStartIso,
} from '../../shared/utils/date-range';

const SUPPORTED_GAMES = new Set(['WHEEL']);

interface ConfigDraft {
  targetRtp: string;
  volatility: 'LOW' | 'MEDIUM' | 'HIGH';
  isLive: boolean;
}

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [configs, setConfigs] = useState<GameConfig[]>([]);
  const [drafts, setDrafts] = useState<Record<string, ConfigDraft>>({});
  const initialRange = defaultMetricsRange();
  const [startDate, setStartDate] = useState(initialRange.start);
  const [endDate, setEndDate] = useState(initialRange.end);
  const [activePresetId, setActivePresetId] = useState<string | null>('30d');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadMetrics = useCallback(
    async (range?: { start: string; end: string }) => {
      const start = range?.start ?? startDate;
      const end = range?.end ?? endDate;
      const data = await getPlatformMetrics(
        localDayStartIso(start),
        localDayEndIso(end),
      );
      setMetrics(data);
    },
    [startDate, endDate],
  );

  const loadConfigs = useCallback(async () => {
    const data = (await getGameConfigurations()).filter((config) =>
      SUPPORTED_GAMES.has(config.gameType),
    );
    setConfigs(data);
    const nextDrafts: Record<string, ConfigDraft> = {};
    for (const config of data) {
      nextDrafts[config.id] = {
        targetRtp: config.targetRtp,
        volatility: config.volatility as ConfigDraft['volatility'],
        isLive: config.isLive,
      };
    }
    setDrafts(nextDrafts);
  }, []);

  const loadAll = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      await Promise.all([loadMetrics(), loadConfigs()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load operator console');
    } finally {
      setLoading(false);
    }
  }, [loadMetrics, loadConfigs]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const refreshMetrics = async (range?: { start: string; end: string }) => {
    setError(null);
    try {
      await loadMetrics(range);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    }
  };

  const applyDateRange = (range: { start: string; end: string }) => {
    setStartDate(range.start);
    setEndDate(range.end);
    const matchedPreset = METRICS_DATE_PRESETS.find((preset) => {
      const resolved = preset.resolve();
      return resolved.start === range.start && resolved.end === range.end;
    });
    setActivePresetId(matchedPreset?.id ?? null);
  };

  const handleCustomRangeChange = (range: { start: string; end: string }) => {
    applyDateRange(range);
  };

  const handlePresetSelect = (
    presetId: string,
    range: { start: string; end: string },
  ) => {
    setStartDate(range.start);
    setEndDate(range.end);
    setActivePresetId(presetId);
    void refreshMetrics(range);
  };

  const saveConfig = async (config: GameConfig) => {
    const draft = drafts[config.id];
    if (!draft) return;

    setSavingId(config.id);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateGameConfiguration(config.id, {
        targetRtp: parseFloat(draft.targetRtp),
        volatility: draft.volatility,
        isLive: draft.isLive,
      });
      setConfigs((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      setSuccess(`${updated.gameType} configuration updated.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update configuration');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <DashboardLayout role="admin">
      <>
        <PageTitle>Operator Console</PageTitle>
        {loading && <p style={{ color: '#94a3b8' }}>Loading…</p>}
        {error && <ErrorText>{error}</ErrorText>}
        {success && <SuccessText>{success}</SuccessText>}

        {!loading && (
          <>
            <Card style={{ marginBottom: '1.25rem' }}>
              <CardTitle>Platform Metrics</CardTitle>
              <DateRangePicker
                start={startDate}
                end={endDate}
                activePresetId={activePresetId}
                onChange={handleCustomRangeChange}
                onPresetSelect={handlePresetSelect}
              />
              <Button type="button" onClick={() => void refreshMetrics()}>
                Update metrics
              </Button>

              {metrics && (
                <div style={{ marginTop: '1rem' }}>
                  <StatRow>
                    <span>Total handle</span>
                    <span>${metrics.totalHandle}</span>
                  </StatRow>
                  <StatRow>
                    <span>Total payout</span>
                    <span>${metrics.totalPayout}</span>
                  </StatRow>
                  <StatRow>
                    <span>Gross gaming revenue (GGR)</span>
                    <span>${metrics.grossGamingRevenue}</span>
                  </StatRow>
                  <StatRow>
                    <span>Hold %</span>
                    <span>{metrics.holdPercentage}%</span>
                  </StatRow>
                </div>
              )}
            </Card>

            <Grid>
              {configs.map((config) => {
                const draft = drafts[config.id];
                if (!draft) return null;

                return (
                  <Card key={config.id}>
                    <CardTitle>
                      {config.gameType}{' '}
                      <Badge $live={draft.isLive}>
                        {draft.isLive ? 'Live' : 'Offline'}
                      </Badge>
                    </CardTitle>

                    <FieldGroup>
                      <Label htmlFor={`rtp-${config.id}`}>Target RTP (%)</Label>
                      <Input
                        id={`rtp-${config.id}`}
                        type="number"
                        min={80}
                        max={99.5}
                        step="0.1"
                        value={draft.targetRtp}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [config.id]: { ...draft, targetRtp: e.target.value },
                          }))
                        }
                      />
                    </FieldGroup>

                    <FieldGroup>
                      <Label htmlFor={`vol-${config.id}`}>Volatility</Label>
                      <Select
                        id={`vol-${config.id}`}
                        value={draft.volatility}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [config.id]: {
                              ...draft,
                              volatility: e.target.value as ConfigDraft['volatility'],
                            },
                          }))
                        }
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </Select>
                    </FieldGroup>

                    <FieldGroup>
                      <Label htmlFor={`live-${config.id}`}>Game status</Label>
                      <Select
                        id={`live-${config.id}`}
                        value={draft.isLive ? 'live' : 'offline'}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [config.id]: {
                              ...draft,
                              isLive: e.target.value === 'live',
                            },
                          }))
                        }
                      >
                        <option value="live">Live</option>
                        <option value="offline">Offline</option>
                      </Select>
                    </FieldGroup>

                    <StatRow>
                      <span>House edge</span>
                      <span>{config.houseEdge}%</span>
                    </StatRow>
                    <StatRow>
                      <span>Last updated</span>
                      <span>{new Date(config.updatedAt).toLocaleString()}</span>
                    </StatRow>

                    <Button
                      type="button"
                      disabled={savingId === config.id}
                      onClick={() => void saveConfig(config)}
                    >
                      {savingId === config.id ? 'Saving…' : 'Save changes'}
                    </Button>
                  </Card>
                );
              })}
            </Grid>
          </>
        )}
      </>
    </DashboardLayout>
  );
}
