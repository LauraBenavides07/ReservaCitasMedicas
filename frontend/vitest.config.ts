import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'], // para SonarQube
      reportsDirectory: './coverage', // Carpeta donde se guardará lcov.info
    },
  },
});