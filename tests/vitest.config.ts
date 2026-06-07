import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['unit/**/*.spec.ts', 'api/**/*.spec.ts', 'e2e/**/*.spec.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    globalSetup: ['./setup/global-setup.ts'],
    reporters: ['verbose'],
    /** Shared player wallet — avoid parallel spins corrupting balance assertions. */
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@backend': path.resolve(__dirname, '../backend/src'),
    },
  },
});
