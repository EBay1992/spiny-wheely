import { useCallback, useEffect, useState } from 'react';
import {
  getGameConfigurations,
  getPlatformMetrics,
  updateGameConfiguration,
  type GameConfig,
  type PlatformMetrics,
} from '../../core/network/api';
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
  Page,
  PageTitle,
  Select,
  StatRow,
  SuccessText,
} from '../../shared/components/DashboardStyles';

const SUPPORTED_GAMES = new Set(['WHEEL']);

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface ConfigDraft {
  targetRtp: string;
  volatility: 'LOW' | 'MEDIUM' | 'HIGH';
  isLive: boolean;
}

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [configs, setConfigs] = useState<GameConfig[]>([]);
  const [drafts, setDrafts] = useState<Record<string, ConfigDraft>>({});
  const [startDate, setStartDate] = useState(
    toDateInputValue(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
  );
  const [endDate, setEndDate] = useState(toDateInputValue(new Date()));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    const data = await getPlatformMetrics(
      new Date(`${startDate}T00:00:00.000Z`).toISOString(),
      new Date(`${endDate}T23:59:59.999Z`).toISOString(),
    );
    setMetrics(data);
  }, [startDate, endDate]);

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

  const refreshMetrics = async () => {
    setError(null);
    try {
      await loadMetrics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    }
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
      <Page style={{ padding: 0 }}>
        <PageTitle>Operator Console</PageTitle>
        {loading && <p style={{ color: '#94a3b8' }}>Loading…</p>}
        {error && <ErrorText>{error}</ErrorText>}
        {success && <SuccessText>{success}</SuccessText>}

        {!loading && (
          <>
            <Card style={{ marginBottom: '1.25rem' }}>
              <CardTitle>Platform Metrics</CardTitle>
              <Grid>
                <FieldGroup>
                  <Label htmlFor="start-date">Start date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </FieldGroup>
                <FieldGroup>
                  <Label htmlFor="end-date">End date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </FieldGroup>
              </Grid>
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
                    <span>Gross gaming revenue</span>
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
      </Page>
    </DashboardLayout>
  );
}
