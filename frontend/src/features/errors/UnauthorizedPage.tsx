import { useLocation } from 'react-router-dom';
import { useAuthStore, type AuthRole } from '../../core/store/authStore';
import { Button } from '../../shared/components/DashboardStyles';
import { StatusLinkButton, StatusPage } from '../../shared/components/StatusPage';

function readRequiredRole(state: unknown): AuthRole | undefined {
  if (!state || typeof state !== 'object' || !('requiredRole' in state)) {
    return undefined;
  }

  const record: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(state)) {
    record[key] = value;
  }

  const requiredRole = record.requiredRole;
  if (requiredRole === 'player' || requiredRole === 'admin') {
    return requiredRole;
  }

  return undefined;
}

export function UnauthorizedPage() {
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);
  const location = useLocation();
  const requiredRole = readRequiredRole(location.state);

  const requiredLabel = requiredRole === 'admin' ? 'operator' : 'player';

  const message =
    role && requiredRole
      ? `You are signed in as ${role === 'admin' ? 'an operator' : 'a player'}, but this area requires ${requiredLabel} access.`
      : 'You do not have permission to view this page.';

  const primaryPath = role === 'admin' ? '/admin' : role === 'player' ? '/play' : '/login';
  const primaryLabel =
    role === 'admin'
      ? 'Operator console'
      : role === 'player'
        ? 'Play wheel'
        : 'Sign in';

  const handleSignOut = (): void => {
    logout();
    window.location.href = '/login';
  };

  return (
    <StatusPage code="403" title="Unauthorized" message={message}>
      <StatusLinkButton to={primaryPath}>{primaryLabel}</StatusLinkButton>
      {role ? (
        <Button type="button" $variant="ghost" onClick={handleSignOut}>
          Sign out
        </Button>
      ) : (
        <StatusLinkButton to="/login" $variant="ghost">
          Sign in
        </StatusLinkButton>
      )}
    </StatusPage>
  );
}
