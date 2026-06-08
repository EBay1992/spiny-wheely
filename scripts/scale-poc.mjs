#!/usr/bin/env node
/**
 * Proof-of-concept: verify load is spread across API replicas.
 * Usage: node scripts/scale-poc.mjs [baseUrl] [requests]
 */
const baseUrl = (process.argv[2] ?? 'http://localhost:8080').replace(/\/$/, '');
const total = Number(process.argv[3] ?? 30);

const instances = new Map();

for (let i = 0; i < total; i += 1) {
  const response = await fetch(`${baseUrl}/health`);
  if (!response.ok) {
    console.error(`Request ${i + 1} failed: HTTP ${response.status}`);
    process.exitCode = 1;
    break;
  }
  const body = await response.json();
  const id = body.instanceId ?? 'unknown';
  instances.set(id, (instances.get(id) ?? 0) + 1);
}

console.log(`\nHit ${baseUrl}/health ${total} times:\n`);
for (const [id, count] of [...instances.entries()].sort((a, b) => b[1] - a[1])) {
  const bar = '█'.repeat(Math.max(1, Math.round((count / total) * 40)));
  console.log(`  ${id.padEnd(28)} ${String(count).padStart(3)}  ${bar}`);
}

const unique = instances.size;
if (unique > 1) {
  console.log(`\n✓ Traffic reached ${unique} distinct API instance(s).`);
} else {
  console.log(`\n⚠ Only 1 instance seen — scale up or check the load balancer.`);
}
