import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';
const SKIP_INTEGRATION = process.env.SKIP_INTEGRATION === '1';
const runtimeFile = join(dirname(fileURLToPath(import.meta.url)), 'runtime.json');

export async function setup(): Promise<void> {
  let apiReachable = false;

  if (!SKIP_INTEGRATION) {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      try {
        const response = await fetch(`${API_URL}/health`);
        if (response.ok) {
          apiReachable = true;
          break;
        }
      } catch {
        // API still starting
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  writeFileSync(runtimeFile, JSON.stringify({ apiReachable, apiUrl: API_URL }));

  if (!apiReachable && !SKIP_INTEGRATION) {
    console.warn(
      `[tests] API not reachable at ${API_URL} — api/ and e2e/ suites will be skipped.`,
    );
  }
}

export async function teardown(): Promise<void> {
  // no-op
}
