import { useCallback, useEffect, useState } from 'react';
import {
  getPlayerGameInfo,
  getPlayerProfile,
  getWagerHistory,
  type PlayerGameInfo,
  type PlayerProfile,
  type WagerHistoryItem,
} from '../../core/network/api';
import { validateWager } from '../../shared/utils/wager-validation';
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
  StatRow,
  SuccessText,
  Table,
} from '../../shared/components/DashboardStyles';

const DEFAULT_WAGER_KEY = 'spiny-default-wager';

export function PlayerDashboard() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [gameInfo, setGameInfo] = useState<PlayerGameInfo | null>(null);
  const [history, setHistory] = useState<WagerHistoryItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [defaultWager, setDefaultWager] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [wagerFieldError, setWagerFieldError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [profileData, gameData, historyPage] = await Promise.all([
        getPlayerProfile(),
        getPlayerGameInfo(),
        getWagerHistory(15),
      ]);
      setProfile(profileData);
      setGameInfo(gameData);
      setHistory(historyPage.items);
      setNextCursor(historyPage.nextCursor);

      const stored = localStorage.getItem(DEFAULT_WAGER_KEY);
      if (stored) {
        setDefaultWager(stored);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const saveDefaultWager = () => {
    if (!gameInfo || !profile) return;

    const value = parseFloat(defaultWager);
    const check = validateWager(
      value,
      gameInfo.minWager,
      gameInfo.maxWager,
      parseFloat(profile.wallet.balance),
    );

    if (!check.valid) {
      setWagerFieldError(check.error);
      setSaved(false);
      return;
    }

    localStorage.setItem(DEFAULT_WAGER_KEY, value.toFixed(2));
    setWagerFieldError(null);
    setError(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const loadMoreHistory = async () => {
    if (!nextCursor) return;
    try {
      const page = await getWagerHistory(15, nextCursor);
      setHistory((prev) => [...prev, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more history');
    }
  };

  return (
    <DashboardLayout role="player">
      <Page style={{ padding: 0 }}>
        <PageTitle>Player Dashboard</PageTitle>
        {loading && <p style={{ color: '#94a3b8' }}>Loading…</p>}
        {error && <ErrorText>{error}</ErrorText>}

        {!loading && profile && gameInfo && (
          <Grid>
            <Card>
              <CardTitle>Account</CardTitle>
              <StatRow>
                <span>Email</span>
                <span>{profile.email}</span>
              </StatRow>
              <StatRow>
                <span>Balance</span>
                <span>
                  {profile.wallet.currency} {parseFloat(profile.wallet.balance).toFixed(2)}
                </span>
              </StatRow>
              <StatRow>
                <span>Member since</span>
                <span>{new Date(profile.createdAt).toLocaleDateString()}</span>
              </StatRow>
              <Button $variant="ghost" type="button" onClick={() => void loadData()}>
                Refresh
              </Button>
            </Card>

            <Card>
              <CardTitle>Game Parameters</CardTitle>
              <StatRow>
                <span>Status</span>
                <span>
                  <Badge $live={gameInfo.isLive}>{gameInfo.isLive ? 'Live' : 'Offline'}</Badge>
                </span>
              </StatRow>
              <StatRow>
                <span>Target RTP</span>
                <span>{gameInfo.targetRtp}%</span>
              </StatRow>
              <StatRow>
                <span>House edge</span>
                <span>{gameInfo.houseEdge}%</span>
              </StatRow>
              <StatRow>
                <span>Volatility</span>
                <span>{gameInfo.volatility}</span>
              </StatRow>
              <StatRow>
                <span>Wager limits</span>
                <span>
                  ${gameInfo.minWager} – ${gameInfo.maxWager}
                </span>
              </StatRow>
            </Card>

            <Card>
              <CardTitle>My Preferences</CardTitle>
              <FieldGroup>
                <Label htmlFor="default-wager">Default wager (applied on Play)</Label>
                <Input
                  id="default-wager"
                  type="number"
                  min={gameInfo.minWager}
                  max={gameInfo.maxWager}
                  step="0.1"
                  value={defaultWager}
                  onChange={(e) => {
                    setDefaultWager(e.target.value);
                    setWagerFieldError(null);
                  }}
                  style={
                    wagerFieldError
                      ? { borderColor: 'rgba(248, 113, 113, 0.7)' }
                      : undefined
                  }
                  aria-invalid={Boolean(wagerFieldError)}
                />
              </FieldGroup>
              {wagerFieldError && <ErrorText>{wagerFieldError}</ErrorText>}
              <Button type="button" onClick={saveDefaultWager}>
                Save preference
              </Button>
              {saved && <SuccessText>Preference saved.</SuccessText>}
            </Card>
          </Grid>
        )}

        {!loading && history.length > 0 && (
          <Card style={{ marginTop: '1.25rem' }}>
            <CardTitle>Wager History</CardTitle>
            <Table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Game</th>
                  <th>Wager</th>
                  <th>Payout</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.timestamp).toLocaleString()}</td>
                    <td>{item.gameType}</td>
                    <td>${parseFloat(item.wagerAmount).toFixed(2)}</td>
                    <td>${parseFloat(item.payoutAmount).toFixed(2)}</td>
                    <td
                      style={{
                        color:
                          parseFloat(item.netResult) >= 0 ? '#86efac' : '#fca5a5',
                      }}
                    >
                      {parseFloat(item.netResult) >= 0 ? '+' : ''}
                      ${parseFloat(item.netResult).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {nextCursor && (
              <Button $variant="ghost" type="button" onClick={() => void loadMoreHistory()}>
                Load more
              </Button>
            )}
          </Card>
        )}
      </Page>
    </DashboardLayout>
  );
}

export function getStoredDefaultWager(): number | null {
  const stored = localStorage.getItem(DEFAULT_WAGER_KEY);
  if (!stored) return null;
  const value = parseFloat(stored);
  return Number.isNaN(value) ? null : value;
}
