import { getApiUrl } from './config';

export interface LoginResponse {
  accessToken: string;
  expiresIn: string;
  role: string;
}

export interface PlayerProfile {
  id: string;
  email: string;
  createdAt: string;
  wallet: {
    balance: string;
    currency: string;
    cached: boolean;
  };
}

let authToken: string | null = null;

export function setAuthToken(token: string): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${getApiUrl()}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      typeof body.message === 'string'
        ? body.message
        : `Request failed: ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}

export async function loginPlayer(
  email: string,
  password: string,
): Promise<LoginResponse> {
  return request<LoginResponse>('/player/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getPlayerProfile(): Promise<PlayerProfile> {
  return request<PlayerProfile>('/player/profile');
}
