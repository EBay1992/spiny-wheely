#!/usr/bin/env node
/**
 * High-traffic load test — HTTP + WebSocket under concurrent load.
 * Wheel spins use a player pool (one wallet per worker) to avoid row-lock storms.
 */
import { io } from 'socket.io-client';
import { buildScenarioResult, checkSla } from './metrics.mjs';
import { createPlayerPool, tokenForWorker } from './player-pool.mjs';
import { printReport, writeJsonReport } from './report.mjs';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';
const WHEEL_URL = `${API_URL}/wheel`;

const CONCURRENCY = Number(process.env.LOAD_CONCURRENCY ?? 100);
const DURATION_SEC = Number(process.env.LOAD_DURATION_SEC ?? 30);
const WARMUP_SEC = Number(process.env.LOAD_WARMUP_SEC ?? 3);
const WHEEL_WORKERS = Number(process.env.LOAD_WHEEL_WORKERS ?? Math.min(CONCURRENCY, 50));
const LOAD_PLAYER_COUNT = Number(process.env.LOAD_PLAYER_COUNT ?? WHEEL_WORKERS);
const MIXED_ENABLED = process.env.LOAD_MIXED !== '0';
const SPIN_TIMEOUT_MS = Number(process.env.LOAD_SPIN_TIMEOUT_MS ?? 30_000);

const PLAYER_EMAIL = process.env.TEST_PLAYER_EMAIL ?? 'player@spinywheely.test';
const PLAYER_PASSWORD = process.env.TEST_PLAYER_PASSWORD ?? 'player123';

const SLA = {
  health: {
    maxErrorRatePct: Number(process.env.LOAD_HEALTH_MAX_ERROR_PCT ?? 0.1),
    maxP95Ms: Number(process.env.LOAD_HEALTH_P95_MS ?? 100),
    maxP99Ms: Number(process.env.LOAD_HEALTH_P99_MS ?? 250),
    minThroughputPerSec: Number(process.env.LOAD_HEALTH_MIN_RPS ?? 500),
  },
  profile: {
    maxErrorRatePct: Number(process.env.LOAD_PROFILE_MAX_ERROR_PCT ?? 0.5),
    maxP95Ms: Number(process.env.LOAD_PROFILE_P95_MS ?? 200),
    maxP99Ms: Number(process.env.LOAD_PROFILE_P99_MS ?? 500),
    minThroughputPerSec: Number(process.env.LOAD_PROFILE_MIN_RPS ?? 50),
  },
  wheel: {
    maxErrorRatePct: Number(process.env.LOAD_WHEEL_MAX_ERROR_PCT ?? 1),
    maxP95Ms: Number(process.env.LOAD_WHEEL_P95_MS ?? 1000),
    maxP99Ms: Number(process.env.LOAD_WHEEL_P99_MS ?? 3000),
    minThroughputPerSec: Number(process.env.LOAD_WHEEL_MIN_RPS ?? 10),
  },
  mixed: {
    maxErrorRatePct: Number(process.env.LOAD_MIXED_MAX_ERROR_PCT ?? 1),
    maxP95Ms: Number(process.env.LOAD_MIXED_P95_MS ?? 1500),
    maxP99Ms: Number(process.env.LOAD_MIXED_P99_MS ?? 4000),
  },
};

function failureKey(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('timeout')) return 'spin timeout';
  if (message.includes('Insufficient')) return 'insufficient balance';
  if (message.includes('Authentication')) return 'auth required';
  if (message.includes('Wager must')) return 'invalid wager';
  return message.slice(0, 80);
}

async function verifyApiUp() {
  const res = await fetch(`${API_URL}/health`);
  if (!res.ok) throw new Error(`API unhealthy: ${res.status}`);
}

async function runWorkers({ workerCount, durationSec, task }) {
  const end = Date.now() + durationSec * 1000;
  let ok = 0;
  let fail = 0;
  const latencies = [];
  const failureCounts = {};

  function recordFail(error) {
    fail += 1;
    const key = failureKey(error);
    failureCounts[key] = (failureCounts[key] ?? 0) + 1;
  }

  async function worker(workerIndex) {
    while (Date.now() < end) {
      const start = performance.now();
      try {
        await task(workerIndex);
        ok += 1;
        latencies.push(performance.now() - start);
      } catch (error) {
        recordFail(error);
      }
    }
  }

  const started = Date.now();
  await Promise.all(
    Array.from({ length: workerCount }, (_, index) => worker(index)),
  );

  return {
    ok,
    fail,
    latencies,
    failureCounts,
    durationMs: Date.now() - started,
  };
}

function placeWager(token, wagerAmount) {
  return new Promise((resolve, reject) => {
    const socket = io(WHEEL_URL, {
      auth: { token },
      transports: ['websocket'],
      forceNew: true,
    });

    const timer = setTimeout(() => {
      socket.close();
      reject(new Error('spin timeout'));
    }, SPIN_TIMEOUT_MS);

    socket.on('connect', () => {
      socket.emit('wheel:spin', { wagerAmount });
    });

    socket.on('wheel:result', (result) => {
      clearTimeout(timer);
      socket.close();
      resolve(result);
    });

    socket.on('wheel:error', (err) => {
      clearTimeout(timer);
      socket.close();
      reject(new Error(err.message ?? 'wheel error'));
    });

    socket.on('connect_error', (err) => {
      clearTimeout(timer);
      socket.close();
      reject(err);
    });
  });
}

async function scenarioHealthFlood() {
  const result = await runWorkers({
    workerCount: CONCURRENCY,
    durationSec: DURATION_SEC,
    task: async () => {
      const res = await fetch(`${API_URL}/health`);
      if (!res.ok) throw new Error(`health ${res.status}`);
    },
  });

  return buildScenarioResult({
    name: 'HTTP /health flood',
    ...result,
    latenciesMs: result.latencies,
    extra: { workers: CONCURRENCY },
  });
}

async function scenarioPlayerProfile(players) {
  const result = await runWorkers({
    workerCount: CONCURRENCY,
    durationSec: DURATION_SEC,
    task: async (workerIndex) => {
      const token = tokenForWorker(players, workerIndex);
      const res = await fetch(`${API_URL}/player/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`profile ${res.status}`);
      await res.json();
    },
  });

  return buildScenarioResult({
    name: 'HTTP GET /player/profile (authenticated)',
    ...result,
    latenciesMs: result.latencies,
    extra: { workers: CONCURRENCY, playerPoolSize: players.length },
  });
}

async function scenarioWheelSpins(players) {
  const workers = Math.min(WHEEL_WORKERS, players.length);

  const result = await runWorkers({
    workerCount: workers,
    durationSec: DURATION_SEC,
    task: async (workerIndex) => {
      const token = tokenForWorker(players, workerIndex);
      await placeWager(token, 0.1);
    },
  });

  return buildScenarioResult({
    name: 'WebSocket wheel:spin (wallet settlement)',
    ...result,
    latenciesMs: result.latencies,
    extra: {
      workers,
      playerPoolSize: players.length,
      extraNotes: [
        `${workers} workers × ${players.length} funded players (one wallet per worker).`,
      ],
    },
  });
}

async function scenarioMixedTraffic(players) {
  const end = Date.now() + DURATION_SEC * 1000;
  let ok = 0;
  let fail = 0;
  const latencies = [];
  const failureCounts = {};
  const started = Date.now();

  const healthWorkers = Math.floor(CONCURRENCY * 0.5);
  const profileWorkers = Math.floor(CONCURRENCY * 0.3);
  const wheelWorkers = Math.min(
    Math.max(1, Math.floor(WHEEL_WORKERS * 0.4)),
    players.length,
  );

  function recordFail(error) {
    fail += 1;
    const key = failureKey(error);
    failureCounts[key] = (failureCounts[key] ?? 0) + 1;
  }

  async function healthWorker() {
    while (Date.now() < end) {
      const start = performance.now();
      try {
        const res = await fetch(`${API_URL}/health`);
        if (!res.ok) throw new Error('health');
        ok += 1;
        latencies.push(performance.now() - start);
      } catch (error) {
        recordFail(error);
      }
    }
  }

  async function profileWorker(workerIndex) {
    while (Date.now() < end) {
      const start = performance.now();
      try {
        const token = tokenForWorker(players, workerIndex);
        const res = await fetch(`${API_URL}/player/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('profile');
        await res.json();
        ok += 1;
        latencies.push(performance.now() - start);
      } catch (error) {
        recordFail(error);
      }
    }
  }

  async function wheelWorker(workerIndex) {
    while (Date.now() < end) {
      const start = performance.now();
      try {
        const token = tokenForWorker(players, workerIndex);
        await placeWager(token, 0.1);
        ok += 1;
        latencies.push(performance.now() - start);
      } catch (error) {
        recordFail(error);
      }
    }
  }

  await Promise.all([
    ...Array.from({ length: healthWorkers }, () => healthWorker()),
    ...Array.from({ length: profileWorkers }, (_, index) => profileWorker(index)),
    ...Array.from({ length: wheelWorkers }, (_, index) => wheelWorker(index)),
  ]);

  return buildScenarioResult({
    name: 'Mixed traffic (health + profile + wheel)',
    durationMs: Date.now() - started,
    ok,
    fail,
    failureCounts,
    latenciesMs: latencies,
    extra: {
      workers: healthWorkers + profileWorkers + wheelWorkers,
      playerPoolSize: players.length,
      extraNotes: [
        `split: ${healthWorkers} health / ${profileWorkers} profile / ${wheelWorkers} wheel workers`,
      ],
    },
  });
}

async function main() {
  console.log('\n⚡ spinyWheely high-traffic load test starting…\n');
  await verifyApiUp();

  if (WARMUP_SEC > 0) {
    console.log(`Warming up for ${WARMUP_SEC}s…`);
    await runWorkers({
      workerCount: Math.min(10, CONCURRENCY),
      durationSec: WARMUP_SEC,
      task: async () => {
        await fetch(`${API_URL}/health`);
      },
    });
  }

  console.log(`Logging in load-test player pool (target ${LOAD_PLAYER_COUNT})…`);
  const players = await createPlayerPool(API_URL, {
    count: LOAD_PLAYER_COUNT,
    password: PLAYER_PASSWORD,
    fallbackEmail: PLAYER_EMAIL,
  });
  console.log(`Player pool ready: ${players.length} funded wallets\n`);

  const rawScenarios = [];

  console.log(`Running health flood (${CONCURRENCY} workers × ${DURATION_SEC}s)…`);
  rawScenarios.push(await scenarioHealthFlood());

  console.log(`Running profile load (${CONCURRENCY} workers × ${DURATION_SEC}s)…`);
  rawScenarios.push(await scenarioPlayerProfile(players));

  console.log(`Running wheel spins (${WHEEL_WORKERS} workers × ${DURATION_SEC}s)…`);
  rawScenarios.push(await scenarioWheelSpins(players));

  if (MIXED_ENABLED) {
    console.log(`Running mixed traffic (${DURATION_SEC}s)…`);
    rawScenarios.push(await scenarioMixedTraffic(players));
  }

  const slaMap = {
    'HTTP /health flood': SLA.health,
    'HTTP GET /player/profile (authenticated)': SLA.profile,
    'WebSocket wheel:spin (wallet settlement)': SLA.wheel,
    'Mixed traffic (health + profile + wheel)': SLA.mixed,
  };

  const scenarios = rawScenarios.map((scenario) => ({
    ...scenario,
    extraNotes: scenario.extraNotes,
    sla: checkSla(scenario, slaMap[scenario.name] ?? { maxErrorRatePct: 1, maxP95Ms: 5000 }),
  }));

  const totalRequests = scenarios.reduce((sum, s) => sum + s.total, 0);
  const totalFailures = scenarios.reduce((sum, s) => sum + s.fail, 0);
  const overall = {
    totalRequests,
    totalFailures,
    errorRatePct: totalRequests > 0 ? ((totalFailures / totalRequests) * 100).toFixed(3) : '0',
    passed: scenarios.every((s) => s.sla.passed),
  };

  const config = {
    apiUrl: API_URL,
    concurrency: CONCURRENCY,
    wheelWorkers: WHEEL_WORKERS,
    playerPoolSize: players.length,
    durationSec: DURATION_SEC,
    warmupSec: WARMUP_SEC,
    mixedEnabled: MIXED_ENABLED,
  };

  printReport({ config, scenarios, overall });

  const reportPath = writeJsonReport({
    generatedAt: new Date().toISOString(),
    config,
    sla: SLA,
    scenarios,
    overall: {
      ...overall,
      errorRatePct: Number(overall.errorRatePct),
    },
  });

  console.log(`JSON report: ${reportPath}\n`);

  if (!overall.passed) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('\n❌ Load test aborted:', error.message);
  console.error('Ensure API is running and migrations are applied: npm run migration:run\n');
  process.exit(1);
});
