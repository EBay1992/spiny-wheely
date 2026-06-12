import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ensureApiForTests,
  type BootstrapState,
} from './bootstrap-api';

const runtimeFile = join(dirname(fileURLToPath(import.meta.url)), 'runtime.json');

export async function setup(): Promise<void> {
  const state = await ensureApiForTests();
  writeFileSync(runtimeFile, JSON.stringify(state));
}

export async function teardown(): Promise<void> {
  try {
    const { existsSync, readFileSync } = await import('node:fs');
    if (!existsSync(runtimeFile)) {
      return;
    }
    const state = JSON.parse(readFileSync(runtimeFile, 'utf8')) as BootstrapState;
    const { stopManagedApi } = await import('./bootstrap-api');
    stopManagedApi(state);
  } catch {
    // Best-effort cleanup.
  }
}
