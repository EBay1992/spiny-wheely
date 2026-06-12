import { useCallback, useEffect, useState } from 'react';
import {
  getPlayerGameInfo,
  getPlayerProfile,
  getWagerHistory,
  type PlayerGameInfo,
  type PlayerProfile,
  type WagerHistoryItem,
} from '../../core/network/api';
import { WagerPicker } from '../../shared/components/WagerPicker';
import { DashboardLayout } from '../../shared/components/DashboardLayout';
import {
  Button,
  ButtonRow,
  Card,
  CardTitle,
  ErrorText,
  Grid,
  PageTitle,
  StatRow,
  SuccessText,
  Table,
} from '../../shared/components/DashboardStyles';
import { formatSignedUsd } from '../../shared/utils/currency';
import { roundWager, validateWager } from '../../shared/utils/wager-validation';

const DEFAULT_WAGER_KEY = 'spiny-default-wager';

export function PlayerDashboard() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [gameInfo, setGameInfo] = useState<PlayerGameInfo | null>(null);
  const [history, setHistory] = useState<WagerHistoryItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [defaultWager, setDefaultWager] = useState(1);
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
        const parsed = parseFloat(stored);
        if (!Number.isNaN(parsed)) {
          setDefaultWager(parsed);
        }
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

    const balance = parseFloat(profile.wallet.balance);
    const check = validateWager(
      defaultWager,
      gameInfo.minWager,
      gameInfo.maxWager,
      balance,
    );

    if (!check.valid) {
      setWagerFieldError(check.error);
      setSaved(false);
      return;
    }

    localStorage.setItem(DEFAULT_WAGER_KEY, roundWager(defaultWager).toFixed(2));
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

  const balance = profile ? parseFloat(profile.wallet.balance) : 0;

  return (
    <DashboardLayout role="player">
      <>
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
                  {profile.wallet.currency} {balance.toFixed(2)}
                </span>
              </StatRow>
              <StatRow>
                <span>Member since</span>
                <span>{new Date(profile.createdAt).toLocaleDateString()}</span>
              </StatRow>
              <ButtonRow style={{ marginTop: '1.25rem' }}>
                <Button $variant="ghost" type="button" onClick={() => void loadData()}>
                  Refresh
                </Button>
              </ButtonRow>
            </Card>

            <Card>
              <CardTitle>My Preferences</CardTitle>
              <p
                style={{
                  margin: '0 0 1rem',
                  fontSize: '0.85rem',
                  color: '#94a3b8',
                  lineHeight: 1.5,
                }}
              >
                Use +/− to set your default wager. Open the gear for limits and
                quick-pick amounts.
              </p>
              <WagerPicker
                value={defaultWager}
                onChange={(amount) => {
                  setDefaultWager(amount);
                  setWagerFieldError(null);
                }}
                minWager={gameInfo.minWager}
                maxWager={gameInfo.maxWager}
                balance={balance}
                error={wagerFieldError}
              />
              <Button
                type="button"
                onClick={saveDefaultWager}
                style={{ marginTop: '1rem' }}
              >
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
                      {formatSignedUsd(parseFloat(item.netResult))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {nextCursor && (
              <ButtonRow style={{ marginTop: '1.25rem' }}>
                <Button
                  $variant="ghost"
                  type="button"
                  onClick={() => void loadMoreHistory()}
                >
                  Load more
                </Button>
              </ButtonRow>
            )}
          </Card>
        )}
      </>
    </DashboardLayout>
  );
}

export function getStoredDefaultWager(): number | null {
  const stored = localStorage.getItem(DEFAULT_WAGER_KEY);
  if (!stored) return null;
  const value = parseFloat(stored);
  return Number.isNaN(value) ? null : value;
}
