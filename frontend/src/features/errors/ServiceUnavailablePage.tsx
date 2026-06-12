import { isCrossOriginApi } from '../../core/network/config';
import { StatusPage } from '../../shared/components/StatusPage';

interface ServiceUnavailablePageProps {
  onRetry?: () => void;
}

export function ServiceUnavailablePage({ onRetry }: ServiceUnavailablePageProps) {
  const message = isCrossOriginApi()
    ? 'The API is not reachable. Check that Render is awake, VITE_API_URL on Vercel matches your API URL, and REDIS_URL is set if required.'
    : 'The API is not reachable on localhost:3000. From the project root run: docker compose up -d && npm run migration:run && npm run dev (or npm run dev:api in a second terminal).';

  return (
    <StatusPage
      code="503"
      title="Service unavailable"
      message={message}
      actionLabel={onRetry ? 'Retry connection' : undefined}
      onAction={onRetry}
    />
  );
}
