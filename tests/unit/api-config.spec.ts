import { describe, expect, it } from 'vitest';
import { resolveApiUrl } from '@frontend/core/network/config';

describe('resolveApiUrl', () => {
  it('uses Vite proxy in dev when VITE_API_URL is empty', () => {
    expect(
      resolveApiUrl({ dev: true, viteApiUrl: '', useRemoteApiInDev: false }),
    ).toBe('');
  });

  it('ignores VITE_API_URL in dev unless VITE_USE_REMOTE_API is set', () => {
    expect(
      resolveApiUrl({
        dev: true,
        viteApiUrl: 'https://api.example.com',
        useRemoteApiInDev: false,
      }),
    ).toBe('');
  });

  it('uses remote API in dev when VITE_USE_REMOTE_API is true', () => {
    expect(
      resolveApiUrl({
        dev: true,
        viteApiUrl: 'https://api.example.com/',
        useRemoteApiInDev: true,
      }),
    ).toBe('https://api.example.com');
  });

  it('uses VITE_API_URL in production builds', () => {
    expect(
      resolveApiUrl({
        dev: false,
        viteApiUrl: 'https://spinywheely-api.onrender.com',
      }),
    ).toBe('https://spinywheely-api.onrender.com');
  });

  it('uses same-origin in production when VITE_API_URL is empty', () => {
    expect(resolveApiUrl({ dev: false, viteApiUrl: '' })).toBe('');
  });
});
