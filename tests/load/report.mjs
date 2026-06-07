/**
 * Console + JSON reporting for load test results.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function pad(value, width) {
  const text = String(value);
  return text.length >= width ? text : text + ' '.repeat(width - text.length);
}

function latencyRow(label, latency) {
  return (
    `  ${pad(label, 14)} min ${pad(latency.min, 8)}  avg ${pad(latency.avg, 8)}  ` +
    `p50 ${pad(latency.p50, 8)}  p95 ${pad(latency.p95, 8)}  p99 ${pad(latency.p99, 8)}  max ${latency.max}`
  );
}

export function printReport({ config, scenarios, overall }) {
  const line = '─'.repeat(72);

  console.log('\n╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    spinyWheely — Load Test Report                      ║');
  console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

  console.log('Configuration');
  console.log(line);
  for (const [key, value] of Object.entries(config)) {
    console.log(`  ${pad(key, 22)} ${value}`);
  }
  console.log('');

  for (const scenario of scenarios) {
    const status = scenario.sla.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}  ${scenario.name}`);
    console.log(line);
    console.log(
      `  ${pad('requests', 14)} ${scenario.total}  (ok ${scenario.ok} / fail ${scenario.fail})`,
    );
    console.log(
      `  ${pad('error rate', 14)} ${scenario.errorRatePct}%`,
    );
    console.log(
      `  ${pad('throughput', 14)} ${scenario.throughputPerSec} req/s`,
    );
    console.log(
      `  ${pad('duration', 14)} ${scenario.durationSec}s`,
    );
    console.log(latencyRow('latency (ms)', scenario.latencyMs));

    if (scenario.extraNotes?.length) {
      for (const note of scenario.extraNotes) {
        console.log(`  note: ${note}`);
      }
    }

    if (scenario.failureBreakdown?.length) {
      const top = scenario.failureBreakdown.slice(0, 3);
      for (const entry of top) {
        console.log(`  fail reason:   ${entry.reason} (${entry.count}×)`);
      }
    }

    if (!scenario.sla.passed) {
      for (const violation of scenario.sla.violations) {
        console.log(`  ⚠ SLA violation: ${violation}`);
      }
    }
    console.log('');
  }

  console.log('Overall');
  console.log(line);
  console.log(`  ${pad('total requests', 18)} ${overall.totalRequests}`);
  console.log(`  ${pad('total failures', 18)} ${overall.totalFailures}`);
  console.log(`  ${pad('overall error rate', 18)} ${overall.errorRatePct}%`);
  console.log(`  ${pad('verdict', 18)} ${overall.passed ? '✅ RESPONSIVE UNDER LOAD' : '❌ SLA BREACHED'}\n`);
}

export function writeJsonReport(payload) {
  const reportsDir = join(__dirname, 'reports');
  mkdirSync(reportsDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = join(reportsDir, `load-report-${timestamp}.json`);
  writeFileSync(filePath, JSON.stringify(payload, null, 2));
  return filePath;
}
