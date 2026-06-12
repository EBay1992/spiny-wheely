import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const BACKEND_ROOT = join(REPO_ROOT, 'backend');
const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export interface BootstrapState {
  managed: boolean;
  apiUrl: string;
  pid?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runCommand(
  command: string,
  args: string[],
  cwd = REPO_ROOT,
  timeoutMs = 120_000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      env: process.env,
    });

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(
        new Error(
          `${command} ${args.join(' ')} timed out after ${timeoutMs}ms`,
        ),
      );
    }, timeoutMs);

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on('exit', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

async function isApiHealthy(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForApi(maxAttempts = 90): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (await isApiHealthy()) {
      return;
    }
    await sleep(1000);
  }

  throw new Error(
    `API did not become healthy at ${API_URL}. Ensure Docker is running, then retry.`,
  );
}

async function ensureDockerServices(): Promise<void> {
  try {
    await runCommand('docker', ['info'], REPO_ROOT, 15_000);
  } catch {
    throw new Error(
      'Docker is not running or not responding. Start Docker Desktop, wait until it is ready, then re-run npm run test.',
    );
  }

  await runCommand('docker', ['compose', 'up', '-d']);
}

async function ensureApiBuilt(): Promise<void> {
  const mainJs = join(BACKEND_ROOT, 'dist/main.js');
  if (existsSync(mainJs)) {
    return;
  }
  await runCommand('npm', ['run', 'build:api']);
}

function startApiProcess(): ChildProcess {
  return spawn('node', ['dist/main.js'], {
    cwd: BACKEND_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });
}

export async function ensureApiForTests(): Promise<BootstrapState> {
  if (await isApiHealthy()) {
    return { managed: false, apiUrl: API_URL };
  }

  console.log('[tests] Starting Postgres and Redis via Docker Compose…');
  await ensureDockerServices();

  console.log('[tests] Running database migrations…');
  await ensureApiBuilt();
  await runCommand('npm', ['run', 'migration:run']);

  console.log('[tests] Starting API server…');
  const apiProcess = startApiProcess();

  apiProcess.stdout?.on('data', (chunk: Buffer) => {
    process.stdout.write(`[api] ${chunk}`);
  });
  apiProcess.stderr?.on('data', (chunk: Buffer) => {
    process.stderr.write(`[api] ${chunk}`);
  });

  apiProcess.on('exit', (code, signal) => {
    if (code !== null && code !== 0) {
      console.error(`[tests] API process exited (code=${code}, signal=${signal})`);
    }
  });

  try {
    await waitForApi();
  } catch (error) {
    apiProcess.kill('SIGTERM');
    throw error;
  }

  return {
    managed: true,
    apiUrl: API_URL,
    pid: apiProcess.pid,
  };
}

export function stopManagedApi(state: BootstrapState): void {
  if (!state.managed || !state.pid) {
    return;
  }

  try {
    process.kill(state.pid, 'SIGTERM');
  } catch {
    // Process may already have exited.
  }
}
