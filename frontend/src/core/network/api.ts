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

export interface PlayerGameInfo {
  gameType: string;
  targetRtp: string;
  houseEdge: string;
  volatility: string;
  isLive: boolean;
  minWager: number;
  maxWager: number;
}

export interface WagerHistoryItem {
  id: string;
  timestamp: string;
  gameType: string;
  wagerAmount: string;
  payoutAmount: string;
  netResult: string;
}

export interface WagerHistoryPage {
  items: WagerHistoryItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PlatformMetrics {
  startDate: string;
  endDate: string;
  totalHandle: string;
  totalPayout: string;
  grossGamingRevenue: string;
  holdPercentage: string;
}

export interface GameConfig {
  id: string;
  gameType: string;
  targetRtp: string;
  houseEdge: string;
  volatility: string;
  isLive: boolean;
  updatedAt: string;
}

export interface UpdateGameConfigPayload {
  targetRtp?: number;
  volatility?: 'LOW' | 'MEDIUM' | 'HIGH';
  isLive?: boolean;
}

let playerToken: string | null = null;
let adminToken: string | null = null;

export function setPlayerToken(token: string | null): void {
  playerToken = token;
}

export function setAdminToken(token: string | null): void {
  adminToken = token;
}

/** @deprecated Use setPlayerToken */
export function setAuthToken(token: string): void {
  setPlayerToken(token);
}

export function getPlayerToken(): string | null {
  return playerToken;
}

function toHeaderRecord(headers: HeadersInit | undefined): Record<string, string> {
  const result: Record<string, string> = { 'Content-Type': 'application/json' };

  if (!headers) {
    return result;
  }

  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  if (Array.isArray(headers)) {
    for (const [key, value] of headers) {
      result[key] = value;
    }
    return result;
  }

  return { ...result, ...headers };
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = toHeaderRecord(options.headers);

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${getApiUrl()}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = Array.isArray(body.message)
      ? body.message.join(', ')
      : body.message;
    throw new Error(
      typeof message === 'string' ? message : `Request failed: ${response.status}`,
    );
  }

  return response.json();
}

function playerRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  return request<T>(path, options, playerToken);
}

function adminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  return request<T>(path, options, adminToken);
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

export async function loginAdmin(
  email: string,
  password: string,
): Promise<LoginResponse> {
  return request<LoginResponse>('/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getPlayerProfile(): Promise<PlayerProfile> {
  return playerRequest<PlayerProfile>('/player/profile');
}

export async function getPlayerGameInfo(): Promise<PlayerGameInfo> {
  return playerRequest<PlayerGameInfo>('/player/game-info');
}

export async function getWagerHistory(
  limit = 20,
  cursor?: string,
): Promise<WagerHistoryPage> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) {
    params.set('cursor', cursor);
  }
  return playerRequest<WagerHistoryPage>(`/player/wager-history?${params}`);
}

export async function getPlatformMetrics(
  startDate: string,
  endDate: string,
): Promise<PlatformMetrics> {
  const params = new URLSearchParams({ startDate, endDate });
  return adminRequest<PlatformMetrics>(`/admin/metrics?${params}`);
}

export async function getGameConfigurations(): Promise<GameConfig[]> {
  return adminRequest<GameConfig[]>('/admin/games/config');
}

export async function updateGameConfiguration(
  id: string,
  payload: UpdateGameConfigPayload,
): Promise<GameConfig> {
  return adminRequest<GameConfig>(`/admin/games/config/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);
    const response = await fetch(`${getApiUrl()}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

/** Retry while the API is still starting (e.g. `npm run dev` booting Nest). */
export async function waitForApiHealth(
  attempts = 5,
  delayMs = 2_000,
): Promise<boolean> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await checkApiHealth()) {
      return true;
    }
    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return false;
}
