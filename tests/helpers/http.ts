import { API_URL } from './config';

export interface JsonBody {
  [key: string]: unknown;
}

export async function apiRequest<T = JsonBody>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<{ status: number; body: T }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const body = (await response.json().catch(() => ({}))) as T;
  return { status: response.status, body };
}

export async function loginPlayer(
  email: string,
  password: string,
): Promise<string> {
  const { status, body } = await apiRequest<{ accessToken: string }>(
    '/player/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    },
  );

  if (status !== 201 && status !== 200) {
    throw new Error(`Player login failed: ${status}`);
  }

  return body.accessToken;
}

export async function loginAdmin(
  email: string,
  password: string,
): Promise<string> {
  const { status, body } = await apiRequest<{ accessToken: string }>(
    '/admin/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    },
  );

  if (status !== 201 && status !== 200) {
    throw new Error(`Admin login failed: ${status}`);
  }

  return body.accessToken;
}
