import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getPlayerGameInfo, getPlayerProfile } from '../../core/network/api';
import { wheelSocket } from '../../core/network/socket';
import { useAuthStore } from '../../core/store/authStore';
import { usePlayerStore } from '../../core/store/playerStore';
import { getStoredDefaultWager } from '../player/PlayerDashboard';
import { DashboardLayout } from '../../shared/components/DashboardLayout';
import { ErrorText } from '../../shared/components/DashboardStyles';
import { WheelFeature } from './WheelFeature';

export function PlayPage() {
  const role = useAuthStore((s) => s.role);
  const setReady = usePlayerStore((s) => s.setReady);
  const setWager = usePlayerStore((s) => s.setWager);
  const isReady = usePlayerStore((s) => s.isReady);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role !== 'player') return;

    async function bootstrap() {
      try {
        const [profile, gameInfo] = await Promise.all([
          getPlayerProfile(),
          getPlayerGameInfo(),
        ]);

        if (!gameInfo.isLive) {
          setError('Wheel game is currently offline. Check back later.');
          setLoading(false);
          return;
        }

        const balance = parseFloat(profile.wallet.balance);
        setReady(
          profile.email,
          balance,
          profile.wallet.currency,
          gameInfo.minWager,
          gameInfo.maxWager,
        );

        const defaultWager = getStoredDefaultWager();
        if (defaultWager !== null) {
          setWager(defaultWager);
        }

        const token = sessionStorage.getItem('spiny-player-token');
        if (token) {
          wheelSocket.connect(token);
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load game');
      } finally {
        setLoading(false);
      }
    }

    void bootstrap();

    return () => {
      wheelSocket.disconnect();
    };
  }, [role, setReady, setWager]);

  if (role !== 'player') {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardLayout role="player">
      {loading && <p style={{ color: '#fff', textAlign: 'center' }}>Loading wheel…</p>}
      {error && (
        <ErrorText style={{ textAlign: 'center', padding: '2rem' }}>{error}</ErrorText>
      )}
      {!loading && !error && isReady && <WheelFeature />}
    </DashboardLayout>
  );
}
