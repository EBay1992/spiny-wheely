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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'player') {
        await loginPlayer(email, password);
        navigate('/play');
      } else {
        await loginAdmin(email, password);
        navigate('/admin');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <PageTitle>spinyWheely</PageTitle>
      <Card style={{ maxWidth: 420, margin: '0 auto' }}>
        <CardTitle>Sign in</CardTitle>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Button
            type="button"
            $variant={tab === 'player' ? 'primary' : 'ghost'}
            onClick={() => setTab('player')}
          >
            Player
          </Button>
          <Button
            type="button"
            $variant={tab === 'admin' ? 'primary' : 'ghost'}
            onClick={() => setTab('admin')}
          >
            Operator
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                tab === 'player'
                  ? 'demo@spinywheely.test'
                  : 'admin@spinywheely.test'
              }
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
