/** API base URL. Empty string = same origin (Vite dev proxy). */
export function getApiUrl(): string {
  const configured = import.meta.env.VITE_API_URL;
  if (configured !== undefined && configured !== '') {
    return configured;
  }
  if (import.meta.env.DEV) {
    return '';
  }
  return 'http://localhost:3000';
}

export function getWheelSocketUrl(): string {
  const apiUrl = getApiUrl();
  return apiUrl ? `${apiUrl}/wheel` : '/wheel';
}
