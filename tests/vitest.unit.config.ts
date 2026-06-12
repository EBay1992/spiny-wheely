import path from 'node:path';
import { defineConfig } from 'vitest/config';

/** Unit tests only — no API bootstrap. */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['unit/**/*.spec.ts'],
    testTimeout: 30_000,
    reporters: ['verbose'],
  },
  resolve: {
    alias: {
      '@backend': path.resolve(__dirname, '../backend/src'),
      '@frontend': path.resolve(__dirname, '../frontend/src'),
    },
  },
});
