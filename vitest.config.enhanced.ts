import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment configuration
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'clover'],
      reportOnFailure: true,
      cleanOnRerun: true,
      
      // Coverage thresholds
      thresholds: {
        global: {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        // Per-directory thresholds
        'src/services/': {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'src/components/': {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        'src/hooks/': {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
      
      // Files to include/exclude from coverage
      include: [
        'src/**/*.{ts,tsx}',
      ],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.stories.{ts,tsx}',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/test/**/*',
        'src/mocks/**/*',
        'src/types/**/*',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
    },
    
    // Test execution configuration
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    isolate: true,
    pool: 'threads',
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: 4,
      },
    },
    
    // File patterns
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      '__tests__/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
    ],
    
    // Test categorization
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.json',
    },
    
    // Custom test commands
    workspace: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: [
            'src/**/*.integration.test.{ts,tsx}',
            'src/**/*.e2e.test.{ts,tsx}',
            'src/**/*.performance.test.{ts,tsx}',
          ],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['src/**/*.integration.test.{ts,tsx}'],
          testTimeout: 20000,
        },
      },
      {
        extends: true,
        test: {
          name: 'e2e',
          include: ['src/**/*.e2e.test.{ts,tsx}'],
          testTimeout: 30000,
        },
      },
      {
        extends: true,
        test: {
          name: 'performance',
          include: ['src/**/*.performance.test.{ts,tsx}'],
          testTimeout: 60000,
        },
      },
    ],
    
    // Reporting configuration
    reporters: [
      'verbose',
      'json',
      'html',
      ['junit', { outputFile: 'test-results/junit.xml' }],
    ],
    outputFile: {
      json: 'test-results/results.json',
      html: 'test-results/index.html',
    },
    
    // Browser testing (for complex scenarios)
    browser: {
      enabled: false, // Enable when needed
      name: 'chromium',
      provider: 'playwright',
      headless: true,
      screenshotOnFailure: true,
      video: false,
    },
    
    // Watch mode configuration
    watch: true,
    watchExclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/test-results/**',
    ],
    
    // Performance monitoring
    logHeapUsage: true,
    
    // Custom matchers and utilities
    globalSetup: ['./src/test/globalSetup.ts'],
    globalTeardown: ['./src/test/globalTeardown.ts'],
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@test': resolve(__dirname, './src/test'),
    },
  },
  
  // Define feature flags for testing
  define: {
    __TEST__: true,
    __DEV__: process.env.NODE_ENV === 'development',
  },
});
