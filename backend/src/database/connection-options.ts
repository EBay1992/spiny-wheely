import type { DataSourceOptions } from 'typeorm';

export interface PostgresConnectionOptions {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  url?: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
}

/** True when Redis host is explicitly configured (omit on free single-instance deploys). */
export function isRedisConfigured(): boolean {
  const host = process.env.REDIS_HOST?.trim();
  return Boolean(host);
}

function sslFromDatabaseUrl(databaseUrl: string): PostgresConnectionOptions['ssl'] {
  try {
    const url = new URL(databaseUrl);
    const sslMode = url.searchParams.get('sslmode');
    if (sslMode === 'disable') {
      return false;
    }
    if (sslMode === 'require' || sslMode === 'verify-full' || sslMode === 'verify-ca') {
      return { rejectUnauthorized: false };
    }
  } catch {
    // Fall through to production default below.
  }

  return process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false;
}

/** Shared Postgres settings for TypeORM and migration scripts. */
export function resolvePostgresConnection(): PostgresConnectionOptions {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl) {
    return {
      url: databaseUrl,
      ssl: sslFromDatabaseUrl(databaseUrl),
    };
  }

  return {
    host: process.env.DATABASE_HOST ?? '127.0.0.1',
    port: parseInt(process.env.DATABASE_PORT ?? '5433', 10),
    username: process.env.DATABASE_USER ?? 'spinywheely',
    password: process.env.DATABASE_PASSWORD ?? 'spinywheely',
    database: process.env.DATABASE_NAME ?? 'spinywheely',
  };
}

export function toTypeOrmOptions(
  connection: PostgresConnectionOptions,
  extra?: DataSourceOptions['extra'],
): DataSourceOptions {
  const base = connection.url
    ? { type: 'postgres' as const, url: connection.url, ssl: connection.ssl }
    : {
        type: 'postgres' as const,
        host: connection.host,
        port: connection.port,
        username: connection.username,
        password: connection.password,
        database: connection.database,
      };

  return {
    ...base,
    extra,
  };
}
