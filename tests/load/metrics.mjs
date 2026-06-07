/**
 * Latency & throughput metrics for load scenarios.
 */

export function percentile(sortedAsc, p) {
  if (sortedAsc.length === 0) return 0;
  const index = Math.ceil((p / 100) * sortedAsc.length) - 1;
  return sortedAsc[Math.max(0, Math.min(index, sortedAsc.length - 1))];
}

export function summarizeLatencies(latenciesMs) {
  if (latenciesMs.length === 0) {
    return {
      count: 0,
      min: 0,
      max: 0,
      avg: 0,
      p50: 0,
      p75: 0,
      p90: 0,
      p95: 0,
      p99: 0,
    };
  }

  const sorted = [...latenciesMs].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, value) => acc + value, 0);

  return {
    count: sorted.length,
    min: round(sorted[0]),
    max: round(sorted[sorted.length - 1]),
    avg: round(sum / sorted.length),
    p50: round(percentile(sorted, 50)),
    p75: round(percentile(sorted, 75)),
    p90: round(percentile(sorted, 90)),
    p95: round(percentile(sorted, 95)),
    p99: round(percentile(sorted, 99)),
  };
}

export function summarizeFailures(failureCounts) {
  const entries = Object.entries(failureCounts).sort((a, b) => b[1] - a[1]);
  return entries.map(([reason, count]) => ({ reason, count }));
}

export function buildScenarioResult({
  name,
  durationMs,
  ok,
  fail,
  latenciesMs,
  failureCounts = {},
  extra = {},
}) {
  const total = ok + fail;
  const errorRate = total > 0 ? (fail / total) * 100 : 0;
  const throughput = durationMs > 0 ? (ok / durationMs) * 1000 : 0;

  return {
    name,
    durationMs: round(durationMs),
    durationSec: round(durationMs / 1000),
    total,
    ok,
    fail,
    errorRatePct: round(errorRate, 3),
    throughputPerSec: round(throughput, 2),
    latencyMs: summarizeLatencies(latenciesMs),
    failureBreakdown: summarizeFailures(failureCounts),
    ...extra,
  };
}

export function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function checkSla(result, sla) {
  const violations = [];

  if (result.errorRatePct > sla.maxErrorRatePct) {
    violations.push(
      `error rate ${result.errorRatePct}% > ${sla.maxErrorRatePct}%`,
    );
  }

  if (result.latencyMs.p95 > sla.maxP95Ms) {
    violations.push(`p95 ${result.latencyMs.p95}ms > ${sla.maxP95Ms}ms`);
  }

  if (sla.maxP99Ms !== undefined && result.latencyMs.p99 > sla.maxP99Ms) {
    violations.push(`p99 ${result.latencyMs.p99}ms > ${sla.maxP99Ms}ms`);
  }

  if (sla.minThroughputPerSec !== undefined && result.throughputPerSec < sla.minThroughputPerSec) {
    violations.push(
      `throughput ${result.throughputPerSec}/s < ${sla.minThroughputPerSec}/s`,
    );
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}
