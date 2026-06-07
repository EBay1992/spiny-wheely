import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const API_URL = process.env.API_URL ?? 'http://localhost:3000';
export const WHEEL_NAMESPACE = `${API_URL}/wheel`;

export const PLAYER_EMAIL =
  process.env.TEST_PLAYER_EMAIL ?? 'player@spinywheely.test';
export const PLAYER_PASSWORD =
  process.env.TEST_PLAYER_PASSWORD ?? 'player123';
export const ADMIN_EMAIL =
  process.env.TEST_ADMIN_EMAIL ?? 'admin@spinywheely.test';
export const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? 'admin123';

function readRuntimeFlag(): boolean {
  try {
    const runtimeFile = join(
      dirname(fileURLToPath(import.meta.url)),
      '../setup/runtime.json',
    );
    if (!existsSync(runtimeFile)) {
      return false;
    }
    const runtime = JSON.parse(readFileSync(runtimeFile, 'utf8')) as {
      apiReachable?: boolean;
    };
    return runtime.apiReachable === true;
  } catch {
    return false;
  }
}

export function isApiReachable(): boolean {
  if (process.env.SKIP_INTEGRATION === '1') {
    return false;
  }
  if (process.env.FORCE_INTEGRATION === '1') {
    return true;
  }
  return readRuntimeFlag();
}

export const integrationDescribe = (name: string, fn: () => void): void => {
  if (isApiReachable()) {
    describe(name, fn);
  } else {
    describe.skip(name, fn);
  }
};
