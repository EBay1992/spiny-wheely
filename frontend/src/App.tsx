import { useEffect, useState } from 'react';
import { GlobalStyle } from './shared/styles/GlobalStyles';
import { WheelFeature } from './features/wheel/WheelFeature';
import { getPlayerProfile, loginPlayer, setAuthToken } from './core/network/api';
import { getApiUrl } from './core/network/config';
import { wheelSocket } from './core/network/socket';
import { usePlayerStore } from './core/store/playerStore';

async function waitForApi(maxAttempts = 20): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await fetch(`${getApiUrl()}/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // API still starting
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('API not reachable — start the backend with npm run dev:api');
}

function App() {
  const setReady = usePlayerStore((s) => s.setReady);
  const [bootError, setBootError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      try {
        await waitForApi();

        const email = import.meta.env.VITE_PLAYER_EMAIL ?? 'player@spinywheely.test';
        const password = import.meta.env.VITE_PLAYER_PASSWORD ?? 'player123';

        const login = await loginPlayer(email, password);
        setAuthToken(login.accessToken);

        const profile = await getPlayerProfile();
        const balance = parseFloat(profile.wallet.balance);

        setReady(profile.email, balance, profile.wallet.currency, 0.1, 100);
        wheelSocket.connect(login.accessToken);
        setBootError(null);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to connect to API';
        setBootError(message);
      } finally {
        setIsLoading(false);
      }
    }

    bootstrap();

    return () => {
      wheelSocket.disconnect();
    };
  }, [setReady]);

  return (
    <>
      <GlobalStyle />
      {isLoading && <p style={{ color: '#fff', textAlign: 'center' }}>Connecting to spinyWheely…</p>}
      {bootError && (
        <p style={{ color: '#ff6b6b', textAlign: 'center', padding: '1rem' }}>
          {bootError}
          <br />
          <small>Run: docker compose up -d && npm run dev</small>
        </p>
      )}
      {!isLoading && !bootError && <WheelFeature />}
    </>
  );
}

export default App;
