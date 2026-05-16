import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import { provideVitestTesting } from '@analogjs/vitest-angular';

export default defineConfig({
  plugins: [angular()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    providers: [provideVitestTesting()],
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
    },
  },
});
