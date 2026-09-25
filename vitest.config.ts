import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // Default fork pools on this Windows host starve under concurrent DOCX + dynamic
    // route imports (worker start / import timeouts). Threads keep the suite green
    // without weakening assertions.
    pool: 'threads',
    maxWorkers: 4,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
