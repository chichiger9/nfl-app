import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@shared/types': path.resolve(__dirname, '../shared/src/index.ts'),
      '@shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
