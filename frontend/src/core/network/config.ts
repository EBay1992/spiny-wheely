export interface ApiUrlEnv {
  dev: boolean;
  viteApiUrl?: string;
  /** Set VITE_USE_REMOTE_API=true to hit a remote API while running Vite locally. */
  useRemoteApiInDev?: boolean;
}

/**
 * Resolves the API base URL for REST and WebSocket clients.
 *
 * | Environment | VITE_API_URL | Result |
 * |-------------|--------------|--------|
 * | `npm run dev` | (empty) | `''` → Vite proxy → localhost:3000 |
 * | `npm run dev` | set + VITE_USE_REMOTE_API=true | remote URL |
 * | Fly production | (empty) | `''` → same origin |
 */
export function resolveApiUrl(env: ApiUrlEnv): string {
  if (env.dev && env.useRemoteApiInDev !== true) {
    return '';
  }

  const configured = env.viteApiUrl?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  return '';
}

/** API base URL. Empty string = same origin (Vite proxy or combined deploy). */
export function getApiUrl(): string {
  return resolveApiUrl({
    dev: import.meta.env.DEV,
    viteApiUrl: import.meta.env.VITE_API_URL,
    useRemoteApiInDev: import.meta.env.VITE_USE_REMOTE_API === 'true',
  });
}

/** True when the UI talks to an API on a different origin. */
export function isCrossOriginApi(): boolean {
  return getApiUrl().length > 0;
}

export function getWheelSocketUrl(): string {
  const apiUrl = getApiUrl();
  return apiUrl ? `${apiUrl}/wheel` : '/wheel';
}
