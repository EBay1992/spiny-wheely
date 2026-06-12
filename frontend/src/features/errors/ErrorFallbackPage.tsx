import { Button } from '../../shared/components/DashboardStyles';
import { StatusPage } from '../../shared/components/StatusPage';

interface ErrorFallbackPageProps {
  error: Error;
  onRetry: () => void;
}

export function ErrorFallbackPage({ error, onRetry }: ErrorFallbackPageProps) {
  return (
    <StatusPage
      code="Error"
      title="Something went wrong"
      message={
        import.meta.env.DEV
          ? error.message
          : 'An unexpected error occurred. You can try again or return home.'
      }
    >
      <Button type="button" onClick={onRetry}>
        Try again
      </Button>
      <Button
        type="button"
        $variant="ghost"
        onClick={() => {
          window.location.href = '/';
        }}
      >
        Go home
      </Button>
    </StatusPage>
  );
}
