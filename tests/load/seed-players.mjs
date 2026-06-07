#!/usr/bin/env node
/**
 * Seeds load-test players via Docker Postgres (when TypeORM CLI is unavailable).
 * Usage: node tests/load/seed-players.mjs
 */
import { execSync } from 'node:child_process';

const COUNT = Number(process.env.LOAD_PLAYER_COUNT ?? 50);
const HASH =
  '$2a$10$yMwpAAaMaS0IEgOmx9p5AuY5oYMrOnYJ2XyLI4SK9NsbNUXNpTmaS';
const BALANCE = process.env.LOAD_PLAYER_BALANCE ?? '50000.00';
const CONTAINER = process.env.POSTGRES_CONTAINER ?? 'spinywheely-postgres';

const statements = [];

for (let index = 1; index <= COUNT; index += 1) {
  const email = `load-player-${String(index).padStart(2, '0')}@spinywheely.test`;
  statements.push(`
    INSERT INTO users (email, password_hash, role)
    VALUES ('${email}', '${HASH}', 'PLAYER')
    ON CONFLICT (email) DO NOTHING;
    INSERT INTO wallets (user_id, balance, currency)
    SELECT id, '${BALANCE}', 'USD' FROM users WHERE email = '${email}'
    ON CONFLICT (user_id) DO NOTHING;
  `);
}

const sql = statements.join('\n');

try {
  execSync(
    `docker exec -i ${CONTAINER} psql -U spinywheely -d spinywheely -v ON_ERROR_STOP=1`,
    { input: sql, stdio: ['pipe', 'inherit', 'inherit'] },
  );
  console.log(`\n✅ Seeded ${COUNT} load-test players (password: player123)\n`);
} catch {
  console.error('\n❌ Seed failed. Is Docker running? docker compose up -d\n');
  process.exit(1);
}
