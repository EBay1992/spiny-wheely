import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../core/store/authStore';
import {
  Button,
  Card,
  CardTitle,
  ErrorText,
  FieldGroup,
  Input,
  Label,
  Page,
  PageTitle,
} from '../../shared/components/DashboardStyles';

type LoginTab = 'player' | 'admin';

const TAB_DEFAULTS: Record<LoginTab, { email: string; password: string }> = {
  player: {
    email: 'demo@spinywheely.test',
    password: 'player123',
  },
  admin: {
    email: 'admin@spinywheely.test',
    password: 'admin123',
  },
};

export function LoginPage() {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.role);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const loginPlayer = useAuthStore((s) => s.loginPlayer);
  const loginAdmin = useAuthStore((s) => s.loginAdmin);

  useEffect(() => {
    if (!isHydrated) return;
    if (role === 'player') navigate('/play', { replace: true });
    if (role === 'admin') navigate('/admin', { replace: true });
  }, [isHydrated, role, navigate]);

  const [tab, setTab] = useState<LoginTab>('player');
  const [email, setEmail] = useState(TAB_DEFAULTS.player.email);
  const [password, setPassword] = useState(TAB_DEFAULTS.player.password);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const switchTab = (next: LoginTab) => {
    setTab(next);
    setEmail(TAB_DEFAULTS[next].email);
    setPassword(TAB_DEFAULTS[next].password);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'player') {
        await loginPlayer(email.trim(), password);
        navigate('/play');
      } else {
        await loginAdmin(email.trim(), password);
        navigate('/admin');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      if (
        tab === 'player' &&
        email.trim().toLowerCase() === TAB_DEFAULTS.admin.email
      ) {
        setError(
          'That is an operator account — switch to the Operator tab and sign in again.',
        );
      } else if (
        tab === 'admin' &&
        email.trim().toLowerCase() === TAB_DEFAULTS.player.email
      ) {
        setError(
          'That is a player account — switch to the Player tab and sign in again.',
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <PageTitle>spinyWheely</PageTitle>
      <Card style={{ maxWidth: 420, margin: '0 auto' }}>
        <CardTitle>Sign in</CardTitle>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Button
            type="button"
            $variant={tab === 'player' ? 'primary' : 'ghost'}
            onClick={() => switchTab('player')}
          >
            Player
          </Button>
          <Button
            type="button"
            $variant={tab === 'admin' ? 'primary' : 'ghost'}
            onClick={() => switchTab('admin')}
          >
            Operator
          </Button>
        </div>

        <p
          style={{
            margin: '0 0 1.25rem',
            fontSize: '0.82rem',
            color: '#94a3b8',
            lineHeight: 1.5,
          }}
        >
          {tab === 'player'
            ? 'Player accounts use the wheel and dashboard.'
            : 'Operator accounts manage metrics and game config — use admin@spinywheely.test here.'}
        </p>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FieldGroup>
          {error && <ErrorText>{error}</ErrorText>}
          <Button type="submit" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </Card>
    </Page>
  );
}
