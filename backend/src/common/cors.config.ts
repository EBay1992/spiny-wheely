import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/**
 * When CORS_ORIGINS is unset, reflects any request origin (fine for local dev).
 * Set CORS_ORIGINS=https://spinywheely.fly.dev,http://localhost:5173 to restrict.
 */
export function buildCorsOptions(): CorsOptions {
  const allowed =
    process.env.CORS_ORIGINS?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [];

  if (allowed.length > 0) {
    return {
      origin: allowed,
      credentials: true,
    };
  }

  return {
    origin: true,
    credentials: true,
  };
}
