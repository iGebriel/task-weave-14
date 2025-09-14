import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/*.config.js',
        '**/types/',
        'src/vite-env.d.ts',
        'src/main.tsx',
        '**/*.test.*',
        '**/*.spec.*',
        '**/mocks.*',
        'coverage/**',
        'dist/**',
        '.next/**',
        'build/**',
      ],
      include: [
        'src/**/*.{ts,tsx}',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        'src/components/**/*.{ts,tsx}': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        'src/hooks/**/*.{ts,tsx}': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
      all: true,
      skipFull: false,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
