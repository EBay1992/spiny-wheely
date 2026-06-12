import { useAuthStore } from '../../core/store/authStore';
import { StatusLinkButton, StatusPage } from '../../shared/components/StatusPage';

function homePathForRole(role: 'player' | 'admin' | null): string {
  if (role === 'player') return '/play';
  if (role === 'admin') return '/admin';
  return '/login';
}

export function NotFoundPage() {
  const role = useAuthStore((s) => s.role);
  const homePath = homePathForRole(role);

  return (
    <StatusPage
      code="404"
      title="Page not found"
      message="The page you requested does not exist or may have been moved."
    >
      <StatusLinkButton to={homePath}>
        {role ? 'Go to home' : 'Sign in'}
      </StatusLinkButton>
      {role ? (
        <StatusLinkButton to="/login" $variant="ghost">
          Switch account
        </StatusLinkButton>
      ) : null}
    </StatusPage>
  );
}
