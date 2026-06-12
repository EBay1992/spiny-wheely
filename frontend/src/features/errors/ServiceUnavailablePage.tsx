import { StatusPage } from '../../shared/components/StatusPage';

export function ServiceUnavailablePage() {
  return (
    <StatusPage
      code="503"
      title="Service unavailable"
      message="The API is not reachable. Start Postgres and Redis, then run npm run dev from the project root."
    />
  );
}
