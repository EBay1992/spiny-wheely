import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/**
 * CORS for split-host production (e.g. Vercel UI + Render API).
 * When CORS_ORIGINS is unset, reflects any request origin (localhost + previews).
 * Set CORS_ORIGINS=https://app.vercel.app,http://localhost:5173 to restrict.
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
